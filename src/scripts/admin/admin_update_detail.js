document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const updateId = urlParams.get("id");

    if (!updateId || updateId === "null") {
        alert("업데이트 ID가 없습니다.");
        window.location.href = "admin_updates.html";
        return;
    }

    const editButton = document.getElementById("edit-update-btn");
    const deleteButton = document.getElementById("delete-update-btn");
    const saveButton = document.getElementById("save-update-btn");

    const titleField = document.getElementById("update-title");
    const contentField = document.getElementById("update-content");

    async function fetchUpdateDetails(id) {
        try {
            const response = await fetch(`/api/updates/${id}`);
            if (!response.ok) throw new Error("업데이트 데이터를 불러오는 데 실패했습니다.");

            const data = await response.json();

            document.getElementById("update-type").textContent = data.type || "업데이트";
            titleField.textContent = data.title || "제목 없음";
            document.getElementById("author").textContent = data.author || "관리자";

            // 작성일 포맷 변경
            const createdDate = new Date(data.created_at);
            const formattedDate = `${createdDate.getFullYear()}. ${String(createdDate.getMonth() + 1).padStart(2, "0")}. ${String(createdDate.getDate()).padStart(2, "0")}`;
            const formattedTime = `${String(createdDate.getHours()).padStart(2, "0")}:${String(createdDate.getMinutes()).padStart(2, "0")}`;
            document.getElementById("created-date").textContent = `${formattedDate} ${formattedTime}`;

            document.getElementById("views").textContent = data.views || "0";
            contentField.textContent = data.content || "내용이 없습니다.";

            const attachmentElement = document.getElementById("attachment");
            if (data.attachment) {
                const fileName = data.attachment.split("/").pop();
                attachmentElement.textContent = fileName;
                attachmentElement.href = `/uploads/${fileName}`;
                attachmentElement.style.display = "inline";
            } else {
                attachmentElement.style.display = "none";
            }
        } catch (error) {
            console.error("업데이트 데이터 로드 오류:", error);
            alert("업데이트 데이터를 불러오는 중 문제가 발생했습니다.");
        }
    }

    async function deleteUpdate(id) {
        try {
            if (!confirm("정말로 이 업데이트를 삭제하시겠습니까?")) return;
            const response = await fetch(`/api/updates/${id}`, { method: "DELETE" });
            if (!response.ok) throw new Error("업데이트 삭제 실패");
            alert("업데이트가 성공적으로 삭제되었습니다.");
            window.location.href = "admin_updates.html";
        } catch (error) {
            console.error("업데이트 삭제 오류:", error);
            alert("업데이트 삭제에 실패했습니다.");
        }
    }

    editButton.addEventListener("click", () => {
        titleField.contentEditable = "true";
        contentField.contentEditable = "true";
        editButton.style.display = "none";
        saveButton.style.display = "inline-block";
        deleteButton.style.display = "none";
        titleField.style.border = "1px solid #ddd";
        contentField.style.border = "1px solid #ddd";
    });

    async function saveUpdate(id) {
        const updatedTitle = titleField.textContent.trim();
        const updatedContent = contentField.textContent.trim();
        if (!updatedTitle || !updatedContent) {
            alert("제목과 내용을 모두 입력해주세요.");
            return;
        }
        try {
            const response = await fetch(`/api/updates/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: updatedTitle, content: updatedContent }),
            });
            if (!response.ok) throw new Error("업데이트 수정 실패");
            alert("업데이트가 성공적으로 수정되었습니다.");
            titleField.contentEditable = "false";
            contentField.contentEditable = "false";
            editButton.style.display = "inline-block";
            saveButton.style.display = "none";
            deleteButton.style.display = "inline-block";
            titleField.style.border = "none";
            contentField.style.border = "none";
        } catch (error) {
            console.error("업데이트 수정 오류:", error);
            alert("업데이트 수정에 실패했습니다.");
        }
    }

    deleteButton.addEventListener("click", () => deleteUpdate(updateId));
    saveButton.addEventListener("click", () => saveUpdate(updateId));
    fetchUpdateDetails(updateId);
});
