// 현재 페이지를 관리하는 변수
let currentPage = 1;
const postsPerPage = 10; // 페이지당 자유게시판 게시글 개수

// 자유게시판 데이터 로드 함수
async function loadGeneralPosts(page = 1, searchQuery = "") {
    try {
        // API 요청
        const response = await fetch(`/api/general-posts?page=${page}&limit=${postsPerPage}&searchQuery=${encodeURIComponent(searchQuery)}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // API 응답 처리
        const result = await response.json();
        const data = result.data || []; // 데이터가 없으면 빈 배열 처리
        const total = result.total || 0;
        const totalPages = result.totalPages || 1;

        console.log("Fetched General Posts:", data);

        // 게시글 리스트 렌더링
        const noticeList = document.getElementById("notice-list");
        noticeList.innerHTML = ""; // 기존 데이터 초기화

        if (data.length === 0) {
            noticeList.innerHTML = "<li>게시글이 없습니다.</li>";
            return;
        }

        // 게시글 데이터를 리스트에 추가
        data.forEach(post => {
            const listItem = document.createElement("li");
            listItem.classList.add("notice-item");
            listItem.innerHTML = `
                <span class="notice-type notice">자유</span>
                <a href="#" class="notice-title" data-id="${post.id}">${post.title}</a>
                <span class="notice-date">${new Date(post.created_at).toLocaleDateString("ko-KR")}</span>
            `;

            // 제목 클릭 시 상세 페이지로 이동
            const titleLink = listItem.querySelector(".notice-title");
            titleLink.addEventListener("click", (event) => {
                event.preventDefault();
                const postId = titleLink.getAttribute("data-id");
                window.location.href = `/src/pages/admin/admin_general_detail.html?id=${postId}`;
            });

            noticeList.appendChild(listItem);
        });

        // 페이지네이션 렌더링
        renderPagination(totalPages, page, searchQuery);
    } catch (error) {
        console.error("Error loading general posts:", error);
        alert("게시글을 불러오는 중 문제가 발생했습니다. 서버를 확인해주세요.");
    }
}

// 페이지네이션 렌더링 함수
function renderPagination(totalPages, currentPage, searchQuery) {
    console.log("Total Pages:", totalPages);
    console.log("Current Page:", currentPage);

    const pagination = document.getElementById("pagination");
    pagination.innerHTML = ""; // 기존 버튼 초기화

    // 이전 버튼
    if (currentPage > 1) {
        const prevButton = document.createElement("button");
        prevButton.textContent = "이전";
        prevButton.addEventListener("click", () => loadGeneralPosts(currentPage - 1, searchQuery));
        pagination.appendChild(prevButton);
    }

    // 페이지 번호 버튼
    const maxPagesToShow = 5; // 한 번에 보여줄 최대 페이지 수
    const startPage = Math.floor((currentPage - 1) / maxPagesToShow) * maxPagesToShow + 1;
    const endPage = Math.min(startPage + maxPagesToShow - 1, totalPages);

    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement("button");
        pageButton.textContent = i;
        if (i === currentPage) {
            pageButton.classList.add("active");
        }
        pageButton.addEventListener("click", () => loadGeneralPosts(i, searchQuery));
        pagination.appendChild(pageButton);
    }

    // 다음 버튼
    if (currentPage < totalPages) {
        const nextButton = document.createElement("button");
        nextButton.textContent = "다음";
        nextButton.addEventListener("click", () => loadGeneralPosts(currentPage + 1, searchQuery));
        pagination.appendChild(nextButton);
    }
}

// 초기 자유게시판 데이터 로드 및 이벤트 리스너 설정
document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("search-input");
    const searchBtn = document.getElementById("search-btn");
    const createPostBtn = document.getElementById("create-post-btn");

    // 검색 버튼 클릭 이벤트
    searchBtn.addEventListener("click", () => {
        const searchValue = searchInput.value;
        loadGeneralPosts(1, searchValue);
    });

    // 글쓰기 버튼 클릭 이벤트 (버튼이 존재할 경우에만 처리)
    if (createPostBtn) {
        createPostBtn.addEventListener("click", () => {
            window.location.href = "/src/pages/admin/admin_general.writing.html";
        });
    }

    // 페이지 로드 시 자유게시판 게시글 불러오기
    loadGeneralPosts();
});
