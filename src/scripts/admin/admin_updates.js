const updatesPerPage = 10; // 페이지당 업데이트 개수
let currentPage = 1;

// 업데이트 데이터 로드 함수
async function loadUpdates(page = 1, filterType = "all", searchQuery = "") {
    try {
        // API 요청을 보내고 데이터 받아오기
        const response = await fetch(`/api/updates?page=${page}&limit=${updatesPerPage}&searchQuery=${encodeURIComponent(searchQuery)}&filterType=${filterType}`);
        const { data, total, totalPages } = await response.json();

        console.log("Fetched Updates:", data); // 서버에서 가져온 데이터 확인용
        console.log("Total Pages:", totalPages, "Current Page:", page); // 디버깅용

        // 데이터가 없을 경우 처리
        if (!data || data.length === 0) {
            const updateList = document.getElementById("update-list");
            updateList.innerHTML = '<li class="no-updates">등록된 업데이트가 없습니다.</li>';
            const pagination = document.getElementById("pagination");
            pagination.innerHTML = ""; // 페이지네이션 초기화
            return;
        }

        // 업데이트 렌더링
        const updateList = document.getElementById("update-list");
        updateList.innerHTML = ""; // 기존 데이터 초기화

        data.forEach(update => {
            const listItem = document.createElement("li");
            listItem.classList.add("update-item");
            listItem.innerHTML = `
                <span class="update-type">${update.type}</span>
                <a href="admin_update_detail.html?id=${update.id}" class="update-title">${update.title}</a>
                <span class="update-date">${new Date(update.created_at).toLocaleDateString()}</span>
                
            `;
            updateList.appendChild(listItem);
        });
        

        // 페이지네이션 렌더링
        renderPagination(totalPages, page, filterType, searchQuery);
    } catch (error) {
        console.error("Error loading updates:", error); // 에러 로그 출력
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
        prevButton.addEventListener("click", () => loadUpdates(currentPage - 1, filterType, searchQuery));
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
            pageButton.classList.add("active"); // 현재 페이지 강조
        }
        pageButton.addEventListener("click", () => loadUpdates(i, filterType, searchQuery));
        pagination.appendChild(pageButton);
    }

    // 다음 버튼
    if (currentPage < totalPages) {
        const nextButton = document.createElement("button");
        nextButton.textContent = "다음";
        nextButton.addEventListener("click", () => loadUpdates(currentPage + 1, filterType, searchQuery));
        pagination.appendChild(nextButton);
    }
}

// 초기 업데이트 로드 및 이벤트 리스너 설정
document.addEventListener("DOMContentLoaded", () => {
    const filterType = document.getElementById("filter-type");
    const searchInput = document.getElementById("search-input");
    const searchBtn = document.getElementById("search-btn");
    const createPostBtn = document.getElementById("create-post-btn");

    // 검색 버튼 클릭 이벤트
    searchBtn.addEventListener("click", () => {
        const filterValue = filterType.value; // 현재 선택된 필터
        const searchValue = searchInput.value; // 검색어
        loadUpdates(1, filterValue, searchValue);
    });

    // 필터 변경 이벤트
    filterType.addEventListener("change", () => {
        const filterValue = filterType.value;
        loadUpdates(1, filterValue, searchInput.value);
    });

    // 글쓰기 버튼 클릭 이벤트
    createPostBtn.addEventListener("click", () => {
        window.location.href = "/src/pages/admin/admin_updateswriting.html"; // 글쓰기 페이지로 이동
    });

    // 페이지 로드 시 전체 업데이트 불러오기
    loadUpdates();
});
