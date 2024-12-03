let currentPage = 1;
const itemsPerPage = 10;

// 검색 관련 변수 추가
let currentSearchFilter = 'title';
let currentSearchKeyword = '';

async function fetchPosts() {
    try {
        const response = await fetch(`/api/strategy-posts?page=${currentPage}&limit=${itemsPerPage}`);
        if (!response.ok) throw new Error('게시글 로드 실패');
        return await response.json();
    } catch (error) {
        console.error('게시글 로드 중 오류:', error);
        return { posts: [], total: 0 };
    }
}

async function displayPosts(page = 1, sortBy = 'latest', category = 'all') {
    try {
        // 검색 매개변수 추가
        let url = `/api/strategy-posts?page=${page}&sortBy=${sortBy}&category=${category}`;
        if (currentSearchKeyword) {
            url += `&filter=${currentSearchFilter}&keyword=${encodeURIComponent(currentSearchKeyword)}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('게시글 로드 실패');
        }

        const data = await response.json();
        const postList = document.getElementById('post-list');
        postList.innerHTML = '';

        if (data.posts.length === 0) {
            postList.innerHTML = '<div class="no-results">검색 결과가 없습니다.</div>';
            updatePagination(1, 1, sortBy);
            return;
        }

        data.posts.forEach(post => {
            const postElement = document.createElement('div');
            postElement.className = 'post-item';

            // 댓글 수 표시 로직
            const commentCount = post.comment_count || 0;
            const commentDisplay = commentCount > 0 ? ` [${commentCount}]` : '';

            // 이미지 첨부 여부에 따라 다른 아이콘 표시
            const hasImages = post.files && JSON.parse(post.files).length > 0;
            const icon = hasImages ? 
                '<i class="fas fa-image"></i> ' : 
                '<i class="fas fa-comment-dots"></i> ';

            // 날짜 표시 로직
            const postDate = new Date(post.created_at);
            const now = new Date();
            let dateDisplay;

            if (
                postDate.getDate() === now.getDate() &&
                postDate.getMonth() === now.getMonth() &&
                postDate.getFullYear() === now.getFullYear()
            ) {
                // 당일 게시물
                dateDisplay = postDate.toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                });
            } else {
                // 이전 게시물
                dateDisplay = postDate.toLocaleDateString('ko-KR', {
                    year: '2-digit',
                    month: '2-digit',
                    day: '2-digit'
                }).replace(/\. /g, '/').replace('.', '');
            }

            // 카테고리 표시 추가
            const categoryText = {
                'boss': '보스',
                'battle': '전투',
                'ability': '능력'
            }[post.category] || '';

            postElement.innerHTML = `
                <div class="post-title">
                    <span class="category-tag">[${categoryText}]</span>
                        ${icon}<a href="strategy_view.html?id=${post.id}">${post.title}${commentDisplay}</a>
                </div>
                <div class="post-info-list">
                    <span class="author">${post.author_name}</span>
                    <span class="separator">|</span>
                    <span class="views">조회 ${post.views}</span>
                    <span class="separator">|</span>
                    <span class="likes">추천 ${post.likes}</span>
                    <span class="separator">|</span>
                    <span class="date">${dateDisplay}</span>
                </div>
            `;

            postList.appendChild(postElement);
        });

        updatePagination(data.currentPage, data.totalPages, sortBy);

    } catch (error) {
        console.error('게시글 로드 중 오류:', error);
        alert('게시글을 불러오는데 실패했습니다.');
    }
}

function updatePagination(currentPage, totalPages, sortBy) {
    const paginationElement = document.querySelector('.pagination');
    paginationElement.innerHTML = '';

    // 이전 페이지 버튼
    const prevButton = document.createElement('button');
    prevButton.className = 'page-btn';
    prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevButton.disabled = currentPage === 1;
    if (!prevButton.disabled) {
        prevButton.onclick = () => displayPosts(currentPage - 1, sortBy);
    }
    paginationElement.appendChild(prevButton);

    // 페이지 번호들을 감싸는 div
    const pageNumbers = document.createElement('div');
    pageNumbers.className = 'page-numbers';
    
    // totalPages가 0이어도 최소 1페이지는 표시
    const maxPages = Math.max(1, totalPages);
    
    for (let i = 1; i <= maxPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        
        if (i === currentPage) {
            pageButton.classList.add('active');
        }
        
        // 게시글이 없는 경우(totalPages가 0) 1페이지 버튼을 비활성화
        if (totalPages === 0 && i === 1) {
            pageButton.disabled = true;
        } else {
            pageButton.onclick = () => displayPosts(i, sortBy);
        }
        
        pageNumbers.appendChild(pageButton);
    }
    paginationElement.appendChild(pageNumbers);

    // 다음 페이지 버튼
    const nextButton = document.createElement('button');
    nextButton.className = 'page-btn';
    nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextButton.disabled = currentPage === maxPages;
    if (!nextButton.disabled) {
        nextButton.onclick = () => displayPosts(currentPage + 1, sortBy);
    }
    paginationElement.appendChild(nextButton);
}

// 검색 처리 함수 추가
async function handleSearch() {
    const searchInput = document.querySelector('.search-bar input');
    currentSearchKeyword = searchInput.value.trim();
    
    if (currentSearchKeyword === '') {
        alert('검색어를 입력해주세요.');
        return;
    }

    try {
        // 현재 선택된 검색 필터 값을 가져옴
        const filterElement = document.getElementById('searchFilter');
        currentSearchFilter = filterElement.value;
        
        // 카테고리가 'full'일 경우 'all'로 변경
        const categorySelect = document.getElementById('category-select');
        const category = categorySelect.value === 'full' ? 'all' : categorySelect.value;
        await displayPosts(1, document.querySelector('input[name="sort"]:checked').value, category);
    } catch (error) {
        console.error('검색 중 오류 발생:', error);
        alert('검색 중 오류가 발생했습니다.');
    }
}

// 검색 초기화 함수 추가
function resetSearch() {
    currentSearchKeyword = '';
    document.querySelector('.search-bar input').value = '';
    document.getElementById('searchFilter').value = 'title';
    const category = document.getElementById('category-select').value;
    displayPosts(1, document.querySelector('input[name="sort"]:checked').value, category);
}

document.addEventListener('DOMContentLoaded', function() {
    // 초기 게시글 로드
    displayPosts(1, 'latest', 'all');

    // 카테고리 선택 이벤트
    document.getElementById('category-select').addEventListener('change', function() {
        const category = this.value === 'full' ? 'all' : this.value;
        const sortBy = document.querySelector('input[name="sort"]:checked').value;
        displayPosts(1, sortBy, category);
    });

    // 정렬 변경 이벤트 리스너
    document.querySelectorAll('input[name="sort"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const category = document.getElementById('category-select').value;
            displayPosts(1, this.value, category);
        });
    });

    // 검색 필터 변경 이벤트 추가
    const searchFilter = document.getElementById('searchFilter');
    if (searchFilter) {
        searchFilter.addEventListener('change', function(e) {
            currentSearchFilter = e.target.value;
            console.log('검색 필터 변경:', currentSearchFilter); // 디버깅용
        });
    }

    // 검색 버튼 클릭 이벤트 추가
    const searchButton = document.querySelector('.search-bar button');
    searchButton.addEventListener('click', handleSearch);

    // 검색어 입력 필드 엔터키 이벤트 추가
    const searchInput = document.querySelector('.search-bar input');
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    // 게시판 제목 클릭 이벤트 수정
    const boardTitle = document.getElementById('board-title');
    boardTitle.addEventListener('click', function() {
        // 검색 초기화
        resetSearch();
        // 카테고리 'all'로 초기화
        const categorySelect = document.getElementById('category-select');
        categorySelect.value = 'full';
        // 첫 페이지, 최신순으로 정렬 초기화
        const latestSortRadio = document.querySelector('input[value="latest"]');
        if (latestSortRadio) {
            latestSortRadio.checked = true;
        }
        // 게시글 새로 불러오기
        displayPosts(1, 'latest', 'all');
    });
});