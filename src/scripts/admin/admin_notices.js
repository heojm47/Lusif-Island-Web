// 현재 페이지를 관리하는 변수
let currentPage = 1;
const noticesPerPage = 10; // 페이지당 공지사항 개수

// 공지사항 데이터 로드 함수
async function loadNotices(page = 1, filterType = "all", searchQuery = "") {
    try {
        const response = await fetch(`/api/notices?page=${page}&limit=${noticesPerPage}`);
        const { data, total, totalPages } = await response.json();

        console.log("Fetched Notices:", data); // 서버에서 가져온 데이터 확인용

        // 필터 적용: 공지, 점검, 전체
        let filteredNotices = data;
        if (filterType !== "all") {
            filteredNotices = filteredNotices.filter(notice =>
                notice.type === (filterType === "notice" ? "공지" : "점검")
            );
        }

        // 검색어 적용
        if (searchQuery.trim() !== "") {
            filteredNotices = filteredNotices.filter(notice =>
                notice.title.includes(searchQuery) || notice.content.includes(searchQuery)
            );
        }

        // 공지사항 렌더링
        const noticeList = document.getElementById("notice-list");
        noticeList.innerHTML = ""; // 기존 데이터 초기화

        // 공지사항 데이터를 화면에 추가
        filteredNotices.forEach(notice => {
            const listItem = document.createElement("li");
            listItem.classList.add("notice-item");
            listItem.innerHTML = `
                <span class="notice-type ${notice.type === "공지" ? "notice" : "maintenance"}">${notice.type}</span>
                <a href="#" class="notice-title" data-id="${notice.id}">${notice.title}</a>
                <span class="notice-date">${new Date(notice.created_at).toLocaleDateString()}</span>
            `;

            // 공지사항 제목 클릭 이벤트 추가
            const titleLink = listItem.querySelector(".notice-title");
            titleLink.addEventListener("click", (event) => {
                event.preventDefault();
                const noticeId = titleLink.getAttribute("data-id");
                window.location.href = `/src/pages/admin/admin_notice_detail.html?id=${noticeId}`;
            });

            noticeList.appendChild(listItem);
        });

        // 페이지네이션 렌더링
        renderPagination(totalPages, page, filterType, searchQuery);
    } catch (error) {
        console.error("Error loading notices:", error); // 에러 로그 출력
    }
}

// 페이지네이션 렌더링 함수
function renderPagination(totalPages, currentPage, filterType, searchQuery) {
    const pagination = document.getElementById("pagination");
    pagination.innerHTML = ""; // 기존 버튼 초기화

    // 이전 버튼
    if (currentPage > 1) {
        const prevButton = document.createElement("button");
        prevButton.textContent = "이전";
        prevButton.addEventListener("click", () => loadNotices(currentPage - 1, filterType, searchQuery));
        pagination.appendChild(prevButton);
    }

    // 페이지 번호 버튼
    const maxPagesToShow = 5;
    const startPage = Math.floor((currentPage - 1) / maxPagesToShow) * maxPagesToShow + 1;
    const endPage = Math.min(startPage + maxPagesToShow - 1, totalPages);

    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement("button");
        pageButton.textContent = i;
        if (i === currentPage) {
            pageButton.classList.add("active");
        }
        pageButton.addEventListener("click", () => loadNotices(i, filterType, searchQuery));
        pagination.appendChild(pageButton);
    }

    // 다음 버튼
    if (currentPage < totalPages) {
        const nextButton = document.createElement("button");
        nextButton.textContent = "다음";
        nextButton.addEventListener("click", () => loadNotices(currentPage + 1, filterType, searchQuery));
        pagination.appendChild(nextButton);
    }
}

// 초기 공지사항 로드 및 이벤트 리스너 설정
document.addEventListener("DOMContentLoaded", () => {
    const filterType = document.getElementById("filter-type");
    const searchInput = document.getElementById("search-input");
    const searchBtn = document.getElementById("search-btn");
    const createPostBtn = document.getElementById("create-post-btn");

    // 검색 버튼 클릭 이벤트
    searchBtn.addEventListener("click", () => {
        const filterValue = filterType.value; // 현재 선택된 필터
        const searchValue = searchInput.value; // 검색어
        loadNotices(1, filterValue, searchValue);
    });

    // 필터 변경 이벤트
    filterType.addEventListener("change", () => {
        const filterValue = filterType.value;
        loadNotices(1, filterValue, searchInput.value);
    });

    // 글쓰기 버튼 클릭 이벤트
    createPostBtn.addEventListener("click", () => {
        window.location.href = "/src/pages/admin/admin_noticewriting.html"; // 글쓰기 페이지로 이동
    });

    // 페이지 로드 시 전체 공지사항 불러오기
    loadNotices();
});
