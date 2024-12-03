document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get("id");

    if (!postId) {
        alert("게시글 ID가 없습니다.");
        window.location.href = "admin_strategy.html";
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
    const categoryContainer = document.createElement("div"); // 카테고리 표시 컨테이너 추가
    categoryContainer.classList.add("category-container");

    let isEditMode = false;
    let currentCategory = ""; // 현재 카테고리를 저장할 변수

    // 게시글 상세 데이터 가져오기
    async function fetchPostDetails() {
        try {
            const response = await fetch(`/api/strategy-posts/${postId}`);
            if (!response.ok) throw new Error("게시글 데이터를 가져오는데 실패했습니다.");

            const data = await response.json();

            // 게시글 데이터 렌더링
            postTitle.textContent = data.title;
            document.getElementById("author").textContent = data.author_name || "익명";
            document.getElementById("created-date").textContent = new Date(data.created_at).toLocaleString("ko-KR");
            document.getElementById("views").textContent = data.views;
            postContent.textContent = data.content;
            document.getElementById("like-count").textContent = data.likes || 0;

            // 카테고리 렌더링
            const categoryDisplay = {
                boss: "보스",
                battle: "전투",
                ability: "능력",
            };
            currentCategory = data.category || "default"; // 현재 카테고리를 저장
            const categoryBadge = document.createElement("span");
            categoryBadge.classList.add("category-badge", currentCategory);
            categoryBadge.textContent = categoryDisplay[currentCategory] || "기타";
            categoryContainer.appendChild(categoryBadge);

            const postHeader = document.querySelector(".post-header");
            postHeader.insertBefore(categoryContainer, postHeader.firstChild);

            renderComments(data.comments || []);
        } catch (error) {
            console.error("게시글 불러오기 오류:", error);
            alert("게시글 정보를 가져오는 중 오류가 발생했습니다.");
        }
    }

    // 게시글 수정 모드 활성화
    function enableEditMode() {
        isEditMode = true;
        postTitle.contentEditable = "true";
        postContent.contentEditable = "true";
        postTitle.style.border = "1px solid #ccc";
        postContent.style.border = "1px solid #ccc";

        // 카테고리 수정 가능하도록 선택 추가
        categoryContainer.innerHTML = `
            <label for="category-select">카테고리: </label>
            <select id="category-select">
                <option value="boss" ${currentCategory === "boss" ? "selected" : ""}>보스</option>
                <option value="battle" ${currentCategory === "battle" ? "selected" : ""}>전투</option>
                <option value="ability" ${currentCategory === "ability" ? "selected" : ""}>능력</option>
            </select>
        `;
        editButton.textContent = "저장";
    }

    // 게시글 수정 저장
    async function savePostChanges() {
        const updatedTitle = postTitle.textContent.trim();
        const updatedContent = postContent.textContent.trim();
        const updatedCategory = document.getElementById("category-select").value; // 선택한 카테고리 값

        if (!updatedTitle || !updatedContent || !updatedCategory) {
            alert("제목, 내용, 카테고리를 모두 입력해주세요.");
            return;
        }

        try {
            const response = await fetch(`/api/strategy-posts/${postId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: updatedTitle,
                    content: updatedContent,
                    category: updatedCategory, // 수정된 카테고리 전달
                }),
            });

            if (!response.ok) throw new Error("게시글 수정 실패");

            alert("게시글이 성공적으로 수정되었습니다.");
            isEditMode = false;
            postTitle.contentEditable = "false";
            postContent.contentEditable = "false";
            postTitle.style.border = "none";
            postContent.style.border = "none";

            // 수정된 카테고리를 반영
            categoryContainer.innerHTML = "";
            const categoryDisplay = {
                boss: "보스",
                battle: "전투",
                ability: "능력",
            };
            const categoryBadge = document.createElement("span");
            categoryBadge.classList.add("category-badge", updatedCategory);
            categoryBadge.textContent = categoryDisplay[updatedCategory] || "기타";
            categoryContainer.appendChild(categoryBadge);

            currentCategory = updatedCategory; // 현재 카테고리 업데이트
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
            const response = await fetch(`/api/strategy-posts/${postId}`, {
                method: "DELETE",
            });

            if (!response.ok) throw new Error("게시글 삭제 실패");

            alert("게시글이 삭제되었습니다.");
            window.location.href = "admin_strategy.html";
        } catch (error) {
            console.error("게시글 삭제 오류:", error);
            alert("게시글 삭제에 실패했습니다.");
        }
    }

    // 댓글 렌더링
    function renderComments(comments) {
        commentList.innerHTML = "";

        comments.forEach((comment) => {
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
            const response = await fetch(`/api/strategy-posts/${postId}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content }),
            });

            if (!response.ok) throw new Error("댓글 등록 실패");

            const newComment = await response.json();
            addCommentToList(newComment);
            commentInput.value = "";
        } catch (error) {
            console.error("댓글 등록 오류:", error);
            alert("댓글 등록에 실패했습니다.");
        }
    }

    // 댓글 추가
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

    // 댓글 삭제
    async function deleteComment(commentId) {
        const confirmDelete = confirm("이 댓글을 삭제하시겠습니까?");
        if (!confirmDelete) return;

        try {
            const response = await fetch(`/api/strategy-comments/${commentId}`, {
                method: "DELETE",
            });

            if (!response.ok) throw new Error("댓글 삭제 실패");

            document.getElementById(`comment-${commentId}`).remove();
            alert("댓글이 삭제되었습니다.");
        } catch (error) {
            console.error("댓글 삭제 오류:", error);
            alert("댓글 삭제에 실패했습니다.");
        }
    }

    // 댓글 삭제 버튼 클릭 이벤트
    commentList.addEventListener("click", (event) => {
        if (event.target.classList.contains("delete-comment-btn")) {
            const commentId = event.target.dataset.id;
            deleteComment(commentId);
        }
    });

    // 수정 버튼 클릭 이벤트
    editButton.addEventListener("click", () => (isEditMode ? savePostChanges() : enableEditMode()));

    // 삭제 버튼 클릭 이벤트
    deleteButton.addEventListener("click", deletePost);

    // 댓글 등록 버튼 클릭 이벤트
    submitCommentButton.addEventListener("click", submitComment);

    // 페이지 로드 시 게시글 상세 데이터 가져오기
    fetchPostDetails();
});
