document.addEventListener('DOMContentLoaded', function () {
    const filterButtons = document.querySelectorAll('.notice-filter button');
    const noticeList = document.querySelector('#notice-list');
    const searchInput = document.querySelector('#search-input');
    const searchButton = document.querySelector('#search-btn'); // 검색 버튼 ID 확인
    const searchFilter = document.querySelector('#search-filter');
    const pagination = document.getElementById("pagination");

    let currentPage = 1;
    let totalPages = 1;

    // 필터 버튼 클릭 이벤트
    filterButtons.forEach(button => {
        button.addEventListener('click', function () {
            const filter = this.getAttribute('data-filter');
            currentPage = 1; // 필터 변경 시 페이지를 1로 초기화
            loadNotices(currentPage, filter);
            setActiveButton(this);
        });
    });

    // 검색 버튼 클릭 이벤트
    if (searchButton) {
        searchButton.addEventListener('click', function () {
            searchNotices();
        });
    } else {
        console.error("검색 버튼을 찾을 수 없습니다.");
    }

    // 엔터 키 입력 시 검색 실행
    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            searchNotices();
        }
    });

    // 공지사항 데이터 로드 함수
    async function loadNotices(page = 1, filterType = "all", searchQuery = "") {
        try {
            currentPage = page; // 현재 페이지 업데이트

            // URL 생성
            const url = filterType === "all" 
                ? `/api/notices?page=${page}&limit=10&searchQuery=${encodeURIComponent(searchQuery)}`
                : `/api/notices?page=${page}&limit=10&searchQuery=${encodeURIComponent(searchQuery)}&filterType=${filterType}`;

            const response = await fetch(url);
            const { data, total, totalPages: totalPagination } = await response.json();

            totalPages = totalPagination; // 전체 페이지 수 업데이트

            // 기존 리스트 초기화
            noticeList.innerHTML = '';

            // 데이터가 없으면 메시지 표시
            if (data.length === 0) {
                const noDataMessage = document.createElement('li');
                noDataMessage.textContent = '검색 결과가 없습니다.';
                noticeList.appendChild(noDataMessage);
                pagination.innerHTML = ''; // 페이지네이션도 초기화
                return;
            }

            // 공지사항 데이터 렌더링
            data.forEach(notice => {
                const listItem = document.createElement('li');
                listItem.classList.add('notice-item');
                listItem.setAttribute('data-type', notice.type);

                // 타입에 따른 CSS 클래스 추가
                const typeClass = notice.type === "공지" ? "type-notice" : "type-maintenance";

                listItem.innerHTML = `
                    <span class="notice-type ${typeClass}">${notice.type}</span>
                    <a href="notice_detail.html?id=${notice.id}" class="notice-title">${notice.title}</a>
                    <span class="notice-date">${new Date(notice.created_at).toLocaleDateString()}</span>
                `;
                noticeList.appendChild(listItem);
            });

            // 페이지네이션 추가
            renderPagination(currentPage, totalPages);
        } catch (err) {
            console.error('공지사항을 불러오는 중 오류 발생:', err);
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
            prevButton.addEventListener("click", () => loadNotices(currentPage - 1));
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

            pageButton.addEventListener("click", () => loadNotices(i));
            pageNumbers.appendChild(pageButton);
        }
        pagination.appendChild(pageNumbers);

        // 다음 버튼 - 항상 표시
        const nextButton = document.createElement("button");
        nextButton.classList.add('page-btn', 'next-btn');
        nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
        if (currentPage < totalPages) {
            nextButton.addEventListener("click", () => loadNotices(currentPage + 1));
        } else {
            nextButton.disabled = true;
        }
        pagination.appendChild(nextButton);
    }

    // 필터링 처리
    function setActiveButton(activeButton) {
        filterButtons.forEach(button => {
            button.classList.remove('active');
        });
        activeButton.classList.add('active');
    }

    // 검색 처리
    function searchNotices() {
        const searchTerm = searchInput.value.trim(); // 검색어 공백 제거
        const selectedFilter = searchFilter.value; // 선택된 필터 값
        currentPage = 1; // 검색 시 페이지를 1로 초기화
        loadNotices(currentPage, selectedFilter, searchTerm); // 검색어와 필터를 기준으로 공지사항 불러오기
    }

    // 페이지 로드 시 기본 공지사항 불러오기
    loadNotices(currentPage);
});
