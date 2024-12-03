document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const noticeId = urlParams.get("id");

    if (!noticeId || noticeId === "null") {
        alert("공지사항 ID가 없습니다.");
        window.location.href = "admin_notices.html"; // 목록 페이지로 이동
        return;
    }

    const editButton = document.getElementById("edit-notice-btn");
    const deleteButton = document.getElementById("delete-notice-btn");
    const saveButton = document.createElement("button"); // 저장 버튼 생성
    saveButton.textContent = "저장";
    saveButton.id = "save-notice-btn";
    saveButton.style.display = "none"; // 초기에는 숨김 처리
    editButton.insertAdjacentElement("afterend", saveButton); // 수정 버튼 뒤에 저장 버튼 추가

    const titleField = document.getElementById("notice-title");
    const contentField = document.getElementById("notice-content");
    const noticeTypeElement = document.getElementById("notice-type");

    // 공지사항 상세 데이터를 가져오는 함수
    async function fetchNoticeDetails(id) {
        try {
            const response = await fetch(`/api/notices/${id}`);
            if (!response.ok) throw new Error(`공지사항 데이터를 불러오는 데 실패했습니다. 상태 코드: ${response.status}`);

            const data = await response.json();
            console.log("공지사항 데이터:", data); // 디버깅용 로그

            // 데이터를 DOM 요소에 삽입
            const noticeType = data.type || "공지"; // 타입이 없는 경우 기본값 '공지'
            noticeTypeElement.textContent = noticeType;

            // 공지와 점검에 따라 클래스 추가로 색상 구분
            if (noticeType === "공지") {
                noticeTypeElement.classList.add("type-notice"); // 공지 스타일
            } else if (noticeType === "점검") {
                noticeTypeElement.classList.add("type-maintenance"); // 점검 스타일
            }

            titleField.textContent = data.title || "제목 없음";
            document.getElementById("author").textContent = data.author || "관리자";

            // 작성일 포맷 변경
            const createdDate = new Date(data.created_at);
            const formattedDate = `${createdDate.getFullYear()}. ${String(createdDate.getMonth() + 1).padStart(2, "0")}. ${String(createdDate.getDate()).padStart(2, "0")}.`;
            const formattedTime = `${String(createdDate.getHours()).padStart(2, "0")}:${String(createdDate.getMinutes()).padStart(2, "0")}`;
            document.getElementById("created-date").textContent = `${formattedDate} ${formattedTime}`;

            document.getElementById("views").textContent = data.views || "0";
            contentField.textContent = data.content || "내용이 없습니다.";

            // 첨부파일 처리
            const attachmentElement = document.getElementById("attachment");
            if (data.attachment) {
                const fileName = data.attachment.split("/").pop(); // 파일명 추출
                attachmentElement.textContent = fileName; // 파일명 설정
                attachmentElement.href = `/uploads/${fileName}`; // 파일 경로 설정
                attachmentElement.style.display = "inline"; // 링크 표시
            } else {
                attachmentElement.textContent = "첨부파일이 없습니다.";
                attachmentElement.style.display = "none"; // 링크 숨김
            }
        } catch (error) {
            console.error("공지사항 데이터 로드 오류:", error);
            alert("공지사항 데이터를 불러오는 중 문제가 발생했습니다.");
        }
    }

    // 공지사항 삭제 함수
    async function deleteNotice(id) {
        try {
            const confirmDelete = confirm("정말로 이 공지사항을 삭제하시겠습니까?");
            if (!confirmDelete) return;

            const response = await fetch(`/api/notices/${id}`, {
                method: "DELETE",
            });
            if (response.status === 204) {
                alert("공지사항이 성공적으로 삭제되었습니다.");
                window.location.href = "admin_notices.html"; // 목록 페이지로 이동
            } else {
                throw new Error(`공지사항 삭제 실패. 상태 코드: ${response.status}`);
            }
        } catch (error) {
            console.error("공지사항 삭제 중 오류:", error);
            alert("공지사항 삭제에 실패했습니다.");
        }
    }

    // 공지사항 수정 모드 활성화
    editButton.addEventListener("click", () => {
        titleField.contentEditable = "true";
        contentField.contentEditable = "true";
        editButton.style.display = "none"; // 수정 버튼 숨기기
        saveButton.style.display = "inline-block"; // 저장 버튼 보이기
        deleteButton.style.display = "none"; // 삭제 버튼 숨기기
        titleField.style.border = "1px solid #ddd";
        contentField.style.border = "1px solid #ddd";
    });

    // 공지사항 저장 함수
    async function saveNotice(id) {
        const updatedTitle = titleField.textContent.trim();
        const updatedContent = contentField.textContent.trim();
    
        if (!updatedTitle || !updatedContent) {
            alert("제목과 내용을 모두 입력해주세요.");
            return;
        }
    
        try {
            const response = await fetch(`/api/notices/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: updatedTitle,
                    content: updatedContent,
                    type: noticeTypeElement.textContent, // 타입 추가 (필요 시)
                }),
            });
    
            const responseData = await response.json(); // 응답 데이터를 JSON으로 변환
    
            if (!response.ok) {
                throw new Error(responseData.message || "공지사항 수정 실패");
            }
    
            alert("공지사항이 성공적으로 수정되었습니다.");
    
            // 저장 후 UI 상태 업데이트
            titleField.contentEditable = "false";
            contentField.contentEditable = "false";
            editButton.style.display = "inline-block"; // 수정 버튼 다시 보이기
            saveButton.style.display = "none"; // 저장 버튼 숨기기
            deleteButton.style.display = "inline-block"; // 삭제 버튼 다시 보이기
    
            // 테두리 제거
            titleField.style.border = "none";
            contentField.style.border = "none";
        } catch (error) {
            console.error("공지사항 수정 중 오류:", error);
            alert("공지사항 수정에 실패했습니다.");
        }
    }
    
    
    // 이벤트 리스너 추가
    deleteButton.addEventListener("click", () => deleteNotice(noticeId));
    saveButton.addEventListener("click", () => saveNotice(noticeId));

    // 공지사항 데이터 로드
    fetchNoticeDetails(noticeId);
});
