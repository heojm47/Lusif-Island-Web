document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get("id");

    if (!postId) {
        alert("게시글 ID가 없습니다.");
        window.location.href = "admin_general.html";
        return;
    }

    const likeButton = document.getElementById("like-button");
    const editButton = document.getElementById("edit-post-btn");
    const deleteButton = document.getElementById("delete-post-btn");
    const commentInput = document.getElementById("comment-input");
    const commentList = document.getElementById("comment-list");
    const submitCommentButton = document.getElementById("submit-comment-btn");

    const postTitle = document.getElementById("post-title");
    const postContent = document.getElementById("post-content");

    let isEditMode = false; // 수정 모드 상태 관리

    // 게시글 상세 데이터 가져오기
    async function fetchPostDetails() {
        try {
            const response = await fetch(`/api/posts/${postId}`);
            const data = await response.json();

            postTitle.textContent = data.title;
            document.getElementById("author").textContent = data.author_name || "익명";
            document.getElementById("created-date").textContent = new Date(data.created_at).toLocaleString("ko-KR");
            document.getElementById("views").textContent = data.views;
            postContent.textContent = data.content;
            document.getElementById("like-count").textContent = data.likes || 0;

            renderComments(data.comments || []);
        } catch (error) {
            console.error("게시글 불러오기 오류:", error);
        }
    }

    // 게시글 수정 모드 활성화
    function enableEditMode() {
        isEditMode = true;
        postTitle.contentEditable = "true";
        postContent.contentEditable = "true";
        postTitle.style.border = "1px solid #ccc";
        postContent.style.border = "1px solid #ccc";
        editButton.textContent = "저장";
    }

    // 게시글 수정 저장
    async function savePostChanges() {
        const updatedTitle = postTitle.textContent.trim();
        const updatedContent = postContent.textContent.trim();

        if (!updatedTitle || !updatedContent) {
            alert("제목과 내용을 모두 입력해주세요.");
            return;
        }

        try {
            const response = await fetch(`/api/posts/${postId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    title: updatedTitle,
                    content: updatedContent
                })
            });

            if (!response.ok) throw new Error("게시글 수정 실패");

            alert("게시글이 성공적으로 수정되었습니다.");
            isEditMode = false;
            postTitle.contentEditable = "false";
            postContent.contentEditable = "false";
            postTitle.style.border = "none";
            postContent.style.border = "none";
            editButton.textContent = "수정";
        } catch (error) {
            console.error("게시글 수정 오류:", error);
            alert("게시글 수정에 실패했습니다.");
        }
    }

    // 게시글 삭제
    async function deletePost() {
        const confirmDelete = confirm("이 게시글을 삭제하시겠습니까?");
        if (!confirmDelete) return;

        try {
            const response = await fetch(`/api/posts/${postId}`, {
                method: "DELETE"
            });

            if (!response.ok) throw new Error("게시글 삭제 실패");

            alert("게시글이 삭제되었습니다.");
            window.location.href = "admin_general.html";
        } catch (error) {
            console.error("게시글 삭제 오류:", error);
            alert("게시글 삭제에 실패했습니다.");
        }
    }

    // 댓글 렌더링
    function renderComments(comments) {
        commentList.innerHTML = ""; // 기존 댓글 초기화

        comments.forEach(comment => {
            const commentItem = document.createElement("li");
            commentItem.id = `comment-${comment.id}`;
            commentItem.innerHTML = `
                <span class="comment-author">${comment.author_name || "익명"}:</span>
                <span class="comment-content">${comment.content}</span>
                <button class="delete-comment-btn" data-id="${comment.id}">X</button>
            `;
            commentList.appendChild(commentItem);
        });
    }

    // 댓글 등록
    async function submitComment() {
        const content = commentInput.value.trim();
        if (!content) {
            alert("댓글을 입력하세요.");
            return;
        }

        try {
            const response = await fetch(`/api/posts/${postId}/comments`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ content })
            });

            if (!response.ok) throw new Error("댓글 등록 실패");

            const newComment = await response.json(); // 새로 추가된 댓글 데이터
            addCommentToList(newComment); // 댓글 리스트에 추가
            commentInput.value = "";
        } catch (error) {
            console.error("댓글 등록 오류:", error);
        }
    }

    // 댓글 삭제
    async function deleteComment(commentId) {
        try {
            const confirmDelete = confirm("이 댓글을 삭제하시겠습니까?");
            if (!confirmDelete) return;

            const response = await fetch(`/api/comments/${commentId}`, {
                method: "DELETE"
            });

            if (!response.ok) throw new Error("댓글 삭제 실패");

            document.getElementById(`comment-${commentId}`).remove();
            alert("댓글이 삭제되었습니다.");
        } catch (error) {
            console.error("댓글 삭제 오류:", error);
        }
    }

    // 댓글 리스트에 새 댓글 추가
    function addCommentToList(comment) {
        const commentItem = document.createElement("li");
        commentItem.id = `comment-${comment.id}`;
        commentItem.innerHTML = `
            <span class="comment-author">${comment.author_name || "익명"}:</span>
            <span class="comment-content">${comment.content}</span>
            <button class="delete-comment-btn" data-id="${comment.id}">X</button>
        `;
        commentList.appendChild(commentItem);
    }

    // 댓글 삭제 버튼 클릭 이벤트
    commentList.addEventListener("click", (event) => {
        if (event.target.classList.contains("delete-comment-btn")) {
            const commentId = event.target.dataset.id;
            deleteComment(commentId);
        }
    });

    // 수정 버튼 클릭 이벤트
    editButton.addEventListener("click", () => {
        if (isEditMode) {
            savePostChanges();
        } else {
            enableEditMode();
        }
    });

    // 삭제 버튼 클릭 이벤트
    deleteButton.addEventListener("click", deletePost);

    // 댓글 등록 버튼 클릭 이벤트
    submitCommentButton.addEventListener("click", submitComment);

    // 페이지 로드 시 게시글 상세 데이터 가져오기
    fetchPostDetails();
});
