// 전역 변수로 선언
let selectedFiles = new Set();

document.addEventListener('DOMContentLoaded', async function() {
    // URL에서 게시글 ID 가져오기
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');

    if (!postId) {
        alert('잘못된 접근입니다.');
        window.location.href = 'strategy.html';
        return;
    }

    try {
        // 현재 로그인한 사용자 정보 가져오기
        const userResponse = await fetch('/api/get-username');
        if (!userResponse.ok) {
            alert('로그인이 필요한 서비스입니다.');
            window.location.href = 'strategy.html';
            return;
        }

        // 게시글 데이터 가져오기
        const response = await fetch(`/api/strategy-posts/${postId}`);
        if (!response.ok) throw new Error('게시글 로드 실패');
        const post = await response.json();

        // 폼에 기존 데이터 채우기
        document.getElementById('title').value = post.title;
        document.getElementById('content').value = post.content;
        document.getElementById('category-select').value = post.category;

        // 기존 파일 정보 불러오기
        if (post.files) {
            const existingFiles = JSON.parse(post.files);
            existingFiles.forEach(filePath => {
                const fileName = filePath.split('/').pop(); // 파일 경로에서 파일명만 추출
                const file = new File([], fileName, {
                    type: 'image/jpeg'
                });
                file.serverPath = filePath; // 서버 경로 저장
                selectedFiles.add(file);
            });
            updateFileList();
        }

        // 파일 선택 시 파일명 표시
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

            // 새 파일들을 Set에 추가
            Array.from(fileInput.files).forEach(file => {
                if (selectedFiles.size >= 3) {
                    alert('첨부파일은 최대 3개까지만 선택 가능합니다.');
                    return;
                }
                // 기존 파일과 새 파일의 총 개수 확인
                const existingFiles = Array.from(selectedFiles).filter(f => f.serverPath);
                const newFiles = Array.from(selectedFiles).filter(f => !f.serverPath);
                
                if (existingFiles.length + newFiles.length + 1 > 3) {
                    alert('첨부파일은 최대 3개까지만 선택 가능합니다.');
                    return;
                }
                
                selectedFiles.add(file);
            });

            updateFileList();
            fileInput.value = ''; // 파일 input 초기화

            // 디버깅을 위한 로그 추가
            console.log('현재 선택된 파일들:');
            selectedFiles.forEach(file => {
                console.log('파일명:', file.name);
                console.log('서버 경로:', file.serverPath || '새로운 파일');
            });
        });

        function updateFileList() {
            const fileNameDiv = document.querySelector('.file-name');
            fileNameDiv.innerHTML = '';
            
            if (selectedFiles.size === 0) {
                fileNameDiv.textContent = '선택된 파일 없음';
                return;
            }

            selectedFiles.forEach(file => {
                const fileTag = document.createElement('div');
                fileTag.className = 'file-tag';
                
                // 파일 이름 표시 방식 수정
                let displayName;
                if (file.serverPath) {
                    // 서버 경로에서 실제 파일명만 추출
                    displayName = file.serverPath.split('/').pop().split('-').pop();
                } else {
                    displayName = file.name;
                }

                fileTag.innerHTML = `
                    <span>${displayName} ${file.serverPath ? '(기존)' : '(새로운 파일)'}</span>
                    <button type="button" class="remove-file">
                        <i class="fas fa-times"></i>
                    </button>
                `;

                fileTag.querySelector('.remove-file').addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    selectedFiles.delete(file);
                    updateFileList();
                });

                fileNameDiv.appendChild(fileTag);
            });
        }

        // 폼 제출 처리
        document.querySelector('.write-form').addEventListener('submit', async function(e) {
            e.preventDefault();

            const formData = new FormData();
            formData.append('title', document.getElementById('title').value);
            formData.append('content', document.getElementById('content').value);
            formData.append('category', document.getElementById('category-select').value);

            // 기존 파일과 새 파일 모두 추가
            selectedFiles.forEach(file => {
                if (file.serverPath) {
                    formData.append('existingFiles', file.serverPath);
                } else {
                    formData.append('files', file);
                }
            });

            try {
                const response = await fetch(`/api/strategy-posts/${postId}`, {
                    method: 'PUT',
                    body: formData
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || '게시글 수정 실패');
                }

                alert('게시글이 수정되었습니다.');
                window.location.href = `strategy_view.html?id=${postId}`;
            } catch (error) {
                console.error('게시글 수정 중 오류:', error);
                alert(error.message || '게시글 수정에 실패했습니다.');
            }
        });

    } catch (error) {
        console.error('게시글 로드 중 오류:', error);
        alert('게시글을 불러올는데 실패했습니다.');
        window.location.href = 'strategy.html';
    }

    // 취소 버튼 클릭 시 확인
    document.querySelector('.cancel').addEventListener('click', function(e) {
        e.preventDefault();
        if (confirm('수정을 취소하시겠습니까? 변경사항이 저장되지 않습니다.')) {
            window.location.href = `strategy_view.html?id=${postId}`;
        }
    });
});