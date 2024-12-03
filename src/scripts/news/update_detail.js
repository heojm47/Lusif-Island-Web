document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const updateId = urlParams.get("id");

    // 업데이트 ID 확인
    if (!updateId) {
        alert("업데이트 ID가 없습니다.");
        return;
    }

    // 업데이트 상세 데이터를 가져오는 함수
    async function fetchUpdateDetails(id) {
        try {
            const response = await fetch(`/api/updates/${id}`);
            if (!response.ok) throw new Error("업데이트 정보를 가져오는 데 실패했습니다.");

            const data = await response.json();

            // 데이터를 DOM 요소에 삽입
            document.getElementById("update-type").textContent = data.type || "업데이트";
            document.getElementById("update-title").textContent = data.title || "제목 없음";
            document.getElementById("author").textContent = data.author || "관리자";

            // 작성일 포맷 변경
            const createdDate = new Date(data.created_at);
            const formattedDate = `${createdDate.getFullYear()}. ${String(createdDate.getMonth() + 1).padStart(2, "0")}. ${String(createdDate.getDate()).padStart(2, "0")}.`;
            const formattedTime = `${String(createdDate.getHours()).padStart(2, "0")}:${String(createdDate.getMinutes()).padStart(2, "0")}`;
            document.getElementById("created-date").textContent = `${formattedDate} ${formattedTime}`;

            document.getElementById("views").textContent = data.views || "0";
            document.getElementById("update-content").innerHTML = data.content || "내용이 없습니다.";

            // 첨부파일 처리
            const attachmentElement = document.getElementById("attachment");
            const noAttachmentMessage = document.getElementById("no-attachment-message");

            if (data.attachment) {
                const fileName = data.attachment.split("/").pop(); // 경로에서 파일명 추출
                attachmentElement.textContent = fileName;
                attachmentElement.href = `/uploads/${fileName}`; // 서버 경로에 맞게 수정
                attachmentElement.style.display = "inline";
                noAttachmentMessage.style.display = "none";
            } else {
                attachmentElement.style.display = "none";
                noAttachmentMessage.style.display = "inline";
            }
        } catch (error) {
            console.error("업데이트 정보 로드 중 오류:", error);
            alert("업데이트 정보를 로드하는 중 오류가 발생했습니다.");
        }
    }

    // 조회수 증가 처리 함수
    async function incrementViews(id) {
        try {
            const response = await fetch(`/api/updates/${id}/increment-views`, {
                method: "POST",
            });
            if (!response.ok) throw new Error("조회수 증가 요청 실패");
        } catch (error) {
            console.error("조회수 증가 중 오류:", error);
        }
    }

    // 업데이트 상세 정보 로드 및 조회수 증가 호출
    fetchUpdateDetails(updateId);
    incrementViews(updateId);
});
