document.addEventListener('DOMContentLoaded', async function() {
    // 현재 로그인한 사용자 정보 가져오기
    let currentUser = null;
    try {
        const response = await fetch('/api/get-username');
        if (response.ok) {
            const data = await response.json();
            currentUser = data.username;
        } else {
            // 로그인하지 않은 경우 글쓰기 페이지에서 목록으로 리다이렉트
            alert('로그인이 필요한 서비스입니다.');
            window.location.href = 'strategy.html';
            return;
        }
    } catch (error) {
        console.error('사용자 정보를 가져오는데 실패했습니다:', error);
        alert('로그인 상태를 확인할 수 없습니다.');
        window.location.href = 'strategy.html';
        return;
    }

    let selectedFiles = new Set(); // 선택된 파일들을 저장할 Set

    document.getElementById('file').addEventListener('change', function() {
        const fileInput = this;
        const fileNameInput = document.querySelector('.file-name');
        
        // 파일 유효성 검사
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        const invalidFiles = Array.from(fileInput.files).filter(file => !allowedTypes.includes(file.type));
        
        if (invalidFiles.length > 0) {
            alert('이미지 파일(JPG, PNG, GIF)만 업로드 가능합니다.');
            fileInput.value = '';
            return;
        }

        // 파일 크기 체크
        const maxSize = 10 * 1024 * 1024; // 10MB
        const oversizedFiles = Array.from(fileInput.files).filter(file => file.size > maxSize);
        
        if (oversizedFiles.length > 0) {
            alert('파일 크기는 각각 10MB를 초과할 수 없습니다.');
            fileInput.value = '';
            return;
        }

        // 새 파일들을 Set에 추가
        Array.from(fileInput.files).forEach(file => {
            if (selectedFiles.size >= 3) {
                alert('첨부파일은 최대 3개까지만 선택 가능합니다.');
                return;
            }
            selectedFiles.add(file);
        });

        updateFileList();
        fileInput.value = ''; // 파일 input 초기화
    });

    function updateFileList() {
        const fileNameDiv = document.querySelector('.file-name');
        fileNameDiv.innerHTML = '';  // 기존 내용 제거
        
        if (selectedFiles.size === 0) {
            fileNameDiv.textContent = '선택된 파일 없음';
            return;
        }

        selectedFiles.forEach(file => {
            const fileTag = document.createElement('div');
            fileTag.className = 'file-tag';
            fileTag.innerHTML = `
                <span>${file.name}</span>
                <button type="button" class="remove-file">
                    <i class="fas fa-times"></i>
                </button>
            `;

            fileTag.querySelector('.remove-file').addEventListener('click', (e) => {
                e.preventDefault();  // 이벤트 전파 방지
                e.stopPropagation();  // 이벤트 버블링 방지
                selectedFiles.delete(file);
                updateFileList();
            });

            fileNameDiv.appendChild(fileTag);
        });
    }

    // 폼 제출 처리 수정
    document.querySelector('.write-form').addEventListener('submit', async function(e) {
        e.preventDefault();

        const title = document.getElementById('title').value;
        const content = document.getElementById('content').value;
        const category = document.getElementById('category-select').value;

        if (!title.trim() || !content.trim()) {
            alert('제목과 내용을 모두 입력해주세요.');
            return;
        }

        if (category === 'full') {
            alert('카테고리를 선택해주세요.');
            return;
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        formData.append('category', category);
        selectedFiles.forEach(file => {
            formData.append('files', file);
        });

        try {
            const response = await fetch('/api/strategy-posts', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                alert('게시글이 등록되었습니다.');
                window.location.href = 'strategy.html';
            } else {
                throw new Error('게시글 등록 실패');
            }
        } catch (error) {
            console.error('게시글 등록 중 오류 발생:', error);
            alert('게시글 등록에 실패했습니다.');
        }
    });

    // 취소 버튼 클릭 시 확인
    document.querySelector('.cancel').addEventListener('click', function(e) {
        const hasContent = document.getElementById('title').value.trim() || 
                          document.getElementById('content').value.trim() ||
                          document.getElementById('file').files.length > 0;

        if (hasContent) {
            if (!confirm('작성 중인 내용이 있습니다. 정말 취소하시겠습니까?')) {
                e.preventDefault();
            }
        }
    });
});