document.addEventListener('DOMContentLoaded', function () {
    // 현재 페이지 확인 (update.html 전용)
    const isUpdatePage = window.location.pathname.includes('update.html');
    if (!isUpdatePage) {
        return; // update.html이 아니면 실행하지 않음
    }

    const updateList = document.querySelector('.update-list');
    const searchInput = document.querySelector('.search-bar input');
    const searchButton = document.querySelector('.search-bar button');
    const pagination = document.getElementById('pagination');

    // 필요한 요소가 없으면 중단
    if (!updateList || !searchInput || !searchButton || !pagination) {
        console.error('필요한 요소가 HTML에 없습니다.');
        return;
    }

    let currentPage = 1;
    let totalPages = 1;

    // 검색 버튼 클릭 이벤트
    searchButton.addEventListener('click', function () {
        searchUpdates();
    });

    // 엔터 키 입력 시 검색 실행
    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            searchUpdates();
        }
    });

    // 업데이트 데이터 로드 함수
    async function loadUpdates(page = 1, searchQuery = "") {
        try {
            currentPage = page; // 현재 페이지 업데이트
            const url = `/api/updates?page=${page}&limit=10&searchQuery=${encodeURIComponent(searchQuery)}`;
            const response = await fetch(url);

            if (!response.ok) throw new Error('API 호출 실패');

            const { data, total, totalPages: totalPagination } = await response.json();
            totalPages = totalPagination; // 전체 페이지 수 업데이트
            updateList.innerHTML = ''; // 기존 리스트 초기화

            // 데이터가 없으면 메시지 표시
            if (data.length === 0) {
                updateList.innerHTML = '<li class="no-data">검색 결과가 없습니다.</li>';
                pagination.innerHTML = ''; // 페이지네이션도 초기화
                return;
            }

            // 업데이트 데이터 렌더링
            data.forEach(update => {
                const listItem = document.createElement('li');
                listItem.classList.add('update-item');
                listItem.innerHTML = `
                    <span class="update-version">업데이트</span>
                    <a href="javascript:void(0);" class="update-title" data-id="${update.id}">${update.title}</a>
                    <span class="update-date">${new Date(update.created_at).toLocaleDateString()}</span>
                `;
                updateList.appendChild(listItem);
            });

            // 이벤트 위임 방식으로 클릭 이벤트 추가
            updateList.addEventListener('click', function (e) {
                const link = e.target.closest('.update-title');
                if (link) {
                    const updateId = link.dataset.id;
                    window.location.href = `update_detail.html?id=${updateId}`;
                }
            });

            // 페이지네이션 추가
            renderPagination(currentPage, totalPages);
        } catch (err) {
            console.error('업데이트를 불러오는 중 오류 발생:', err);
            updateList.innerHTML = '<li class="error-message">업데이트를 불러올 수 없습니다.</li>';
        }
    }

    // 페이지네이션 렌더링
    function renderPagination(currentPage, totalPages) {
        pagination.innerHTML = ""; // 기존 버튼 초기화

        // 이전 버튼 - 항상 표시
        const prevButton = document.createElement("button");
        prevButton.classList.add('page-btn', 'prev-btn');
        prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
        if (currentPage > 1) {
            prevButton.addEventListener("click", () => loadUpdates(currentPage - 1));
        } else {
            prevButton.disabled = true;
        }
        pagination.appendChild(prevButton);

        // 페이지 번호 버튼들을 감싸는 div 생성
        const pageNumbers = document.createElement("div");
        pageNumbers.classList.add('page-numbers');

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

            pageButton.addEventListener("click", () => loadUpdates(i));
            pageNumbers.appendChild(pageButton);
        }
        pagination.appendChild(pageNumbers);

        // 다음 버튼 - 항상 표시
        const nextButton = document.createElement("button");
        nextButton.classList.add('page-btn', 'next-btn');
        nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
        if (currentPage < totalPages) {
            nextButton.addEventListener("click", () => loadUpdates(currentPage + 1));
        } else {
            nextButton.disabled = true;
        }
        pagination.appendChild(nextButton);
    }

    // 검색 처리
    function searchUpdates() {
        const searchTerm = searchInput.value.trim();
        currentPage = 1; // 검색 시 페이지를 1로 초기화
        loadUpdates(currentPage, searchTerm);
    }

    // 페이지 로드 시 기본 업데이트 불러오기
    loadUpdates(currentPage);
});
