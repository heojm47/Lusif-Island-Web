document.addEventListener("DOMContentLoaded", () => {
    // URL에서 공지사항 ID 추출
    const urlParams = new URLSearchParams(window.location.search);
    const noticeId = urlParams.get("id");

    if (!noticeId) {
        alert("공지사항 ID가 없습니다.");
        return;
    }

    // 공지사항 상세 데이터를 가져오는 함수
    fetch(`/api/notices/${noticeId}`)
        .then((response) => {
            if (!response.ok) {
                throw new Error("공지사항 정보를 가져오는 데 실패했습니다.");
            }
            return response.json();
        })
        .then((data) => {
            // 공지 타입 요소 가져오기
            const noticeTypeElement = document.getElementById("notice-type");
            
            // 공지 타입 텍스트 설정
            noticeTypeElement.textContent = data.type || "공지";
            
            // 기존 type 클래스들 제거
            noticeTypeElement.classList.remove("type-notice", "type-maintenance");
            
            // 타입에 따라 적절한 클래스 추가
            if (data.type === "공지") {
                noticeTypeElement.classList.add("type-notice");
            } else if (data.type === "점검") {
                noticeTypeElement.classList.add("type-maintenance");
            }

            // 데이터를 DOM 요소에 삽입
            document.getElementById("notice-title").textContent = data.title || "제목 없음";
            document.getElementById("author").textContent = "관리자"; // 항상 "관리자"로 표시

            // 작성일 포맷 지정
            const createdDate = new Date(data.created_at);
            const formattedDate = `${createdDate.getFullYear()}. ${String(createdDate.getMonth() + 1).padStart(2, "0")}. ${String(createdDate.getDate()).padStart(2, "0")}.`;
            const formattedTime = `${String(createdDate.getHours()).padStart(2, "0")}:${String(createdDate.getMinutes()).padStart(2, "0")}`;
            document.getElementById("created-date").textContent = `${formattedDate} ${formattedTime}`;

            document.getElementById("views").textContent = data.views || "0";
            document.getElementById("notice-content").innerHTML = data.content || "내용이 없습니다.";

            // 첨부파일 링크 설정
            const attachmentElement = document.getElementById("attachment");
            if (data.attachment) {
                const fileName = data.attachment.split("\\").pop().split("/").pop(); // 경로 구분자를 기준으로 파일명만 추출
                attachmentElement.textContent = fileName; // 파일명 표시
                attachmentElement.href = `/uploads/${fileName}`; // 다운로드 링크 설정
                attachmentElement.style.display = "inline"; // 첨부파일 링크 보이기
            } else {
                attachmentElement.style.display = "none"; // 첨부파일이 없으면 숨기기
            }
        })
        .catch((error) => {
            console.error(error);
            alert("공지사항 정보를 로드하는 중 오류가 발생했습니다.");
        });
});
