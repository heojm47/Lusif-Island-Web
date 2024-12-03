document.addEventListener("DOMContentLoaded", () => {
    const noticeList = document.getElementById("notice-list");
    const pagination = document.getElementById("pagination");
    const categorySelect = document.getElementById("category-select");
    const searchInput = document.getElementById("search-input");
    const searchBtn = document.getElementById("search-btn");

    let currentPage = 1;
    const postsPerPage = 10;

    // 카테고리 한글로 변환
    const categoryMap = {
        boss: "보스",
        battle: "전투",
        ability: "능력",
        all: "전체",
    };

    // 공략게시판 데이터 로드 함수
    async function loadStrategyPosts(page = 1, category = "all", searchQuery = "") {
        try {
            currentPage = page; // 현재 페이지 업데이트

            const response = await fetch(
                `/api/strategy-posts?page=${page}&limit=${postsPerPage}&category=${category}&keyword=${encodeURIComponent(searchQuery)}`
            );
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const { posts, totalPages } = await response.json();

            // 게시글 목록 렌더링
            renderPosts(posts);

            // 페이지네이션 렌더링
            renderPagination(totalPages, page, category, searchQuery);
        } catch (error) {
            console.error("Error loading strategy posts:", error);
            alert("공략 게시판 데이터를 불러오는 중 오류가 발생했습니다.");
        }
    }

    function renderPosts(posts) {
        noticeList.innerHTML = ""; // 기존 데이터 초기화
        if (posts.length === 0) {
            noticeList.innerHTML = "<li>게시글이 없습니다.</li>";
            return;
        }

        posts.forEach((post) => {
            const listItem = document.createElement("li");
            listItem.classList.add("notice-item");

            // 카테고리에 따라 동적으로 클래스 추가
            const categoryClass = post.category === "boss"
                ? "boss"
                : post.category === "battle"
                ? "battle"
                : "ability";

            listItem.innerHTML = `
                <span class="notice-type ${categoryClass}">${categoryMap[post.category]}</span>
                <a href="#" class="notice-title" data-id="${post.id}">${post.title}</a>
                <span class="notice-date">${new Date(post.created_at).toLocaleDateString("ko-KR")}</span>
            `;

            listItem.querySelector(".notice-title").addEventListener("click", (event) => {
                event.preventDefault();
                const postId = listItem.querySelector(".notice-title").dataset.id;
                window.location.href = `/src/pages/admin/admin_strategy_detail.html?id=${postId}`;
            });

            noticeList.appendChild(listItem);
        });
    }

    function renderPagination(totalPages, currentPage, category, searchQuery) {
        pagination.innerHTML = ""; // 기존 버튼 초기화

        // 이전 버튼
        if (currentPage > 1) {
            const prevButton = document.createElement("button");
            prevButton.textContent = "이전";
            prevButton.addEventListener("click", () =>
                loadStrategyPosts(currentPage - 1, category, searchQuery)
            );
            pagination.appendChild(prevButton);
        }

        // 페이지 번호 버튼
        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement("button");
            pageButton.textContent = i;
            if (i === currentPage) pageButton.classList.add("active");
            pageButton.addEventListener("click", () =>
                loadStrategyPosts(i, category, searchQuery)
            );
            pagination.appendChild(pageButton);
        }

        // 다음 버튼
        if (currentPage < totalPages) {
            const nextButton = document.createElement("button");
            nextButton.textContent = "다음";
            nextButton.addEventListener("click", () =>
                loadStrategyPosts(currentPage + 1, category, searchQuery)
            );
            pagination.appendChild(nextButton);
        }
    }

    searchBtn.addEventListener("click", () => {
        const category = categorySelect.value;
        const searchQuery = searchInput.value.trim();
        loadStrategyPosts(1, category, searchQuery);
    });

    categorySelect.addEventListener("change", () => {
        const category = categorySelect.value;
        const searchQuery = searchInput.value.trim();
        loadStrategyPosts(1, category, searchQuery);
    });

    loadStrategyPosts(); // 초기 데이터 로드
});
