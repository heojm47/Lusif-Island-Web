document.addEventListener('DOMContentLoaded', async function() {
    // URL에서 게시글 ID 가져오기
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    
    console.log('게시글 ID:', postId); // 게시글 ID 확인

    try {
        // 게시글 데이터 가져오기
        const postResponse = await fetch(`/api/posts/${postId}`);
        console.log('서버 응답:', postResponse);
        
        // 먼저 응답 상태를 확인
        if (!postResponse.ok) {
            throw new Error('게시글 로드 실패');
        }

        // 응답이 정상일 때만 JSON 파싱
        const responseData = await postResponse.json();
        console.log('게시글 데이터:', responseData);

        // 현재 사용자 정보 가져오기
        const userResponse = await fetch('/api/get-username');
        const userData = await userResponse.json();
        const currentUser = userData.email;

        // 상세 디버깅 로그 추가
        console.log('==== 사용자 정보 디버깅 ====');
        console.log('userResponse:', userResponse);
        console.log('userData:', userData);
        console.log('currentUser:', currentUser);
        console.log('responseData:', responseData);
        console.log('게시글 작성자(responseData.author):', responseData.author);
        console.log('타입 비교:');
        console.log('currentUser type:', typeof currentUser);
        console.log('author type:', typeof responseData.author);
        console.log('값 비교:', currentUser === responseData.author);
        console.log('소문자 변환 후 비교:', currentUser?.toLowerCase() === responseData.author?.toLowerCase());
        console.log('========================');

        console.log('현재 로그인한 사용자:', currentUser);
        console.log('게시글 작성자:', responseData.author);

        // 게시글 정보 표시
        document.getElementById('post-title').textContent = responseData.title;
        document.getElementById('post-author').textContent = `작성자: ${responseData.author_name || responseData.author}`;
        document.getElementById('post-date').textContent = `작성일: ${new Date(responseData.created_at).toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        })}`;
        document.getElementById('post-views').textContent = `조회 ${responseData.views}`;
        document.getElementById('post-likes').textContent = `추천 ${responseData.likes}`;
        document.getElementById('post-content').textContent = responseData.content;

        if (responseData.files && responseData.files.length > 0) {
            const files = JSON.parse(responseData.files);
            const imageContainer = document.createElement('div');
            imageContainer.className = 'post-images';
            
            files.forEach(filePath => {
                const img = document.createElement('img');
                img.src = '/' + filePath;
                img.alt = '첨부 이미지';
                imageContainer.appendChild(img);
            });
            
            document.getElementById('post-content').after(imageContainer);
        }

        // 수정/삭제 버튼 표시 여부
        const editButton = document.getElementById('edit-button');
        const deleteButton = document.getElementById('delete-button');
        
        if (currentUser && responseData.author) {
            const isAuthor = currentUser.toLowerCase() === responseData.author.toLowerCase();
            console.log('작성자 일치 여부:', isAuthor);
            
            editButton.style.display = isAuthor ? 'inline-block' : 'none';
            deleteButton.style.display = isAuthor ? 'inline-block' : 'none';
        } else {
            console.log('사용자 정보 누락:', { currentUser, author: responseData.author });
            editButton.style.display = 'none';
            deleteButton.style.display = 'none';
        }

        // 수정 버튼 이벤트 리스너
        document.getElementById('edit-button').addEventListener('click', async () => {
            window.location.href = `edit_post.html?id=${postId}`;
        });

        // 삭제 버튼 이벤트 리스너
        document.getElementById('delete-button').addEventListener('click', async () => {
            if (confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
                try {
                    const response = await fetch(`/api/posts/${postId}`, {
                        method: 'DELETE'
                    });

                    if (!response.ok) {
                        throw new Error('게시글 삭제 실패');
                    }

                    alert('게시글이 삭제되었습니다.');
                    window.location.href = 'general.html';
                } catch (error) {
                    console.error('게시글 삭제 중 오류:', error);
                    alert('게시글 삭제에 실패했습니다.');
                }
            }
        });

        // 댓글 등록 버튼 이벤트 리스너 추가
        document.getElementById('submit-comment').addEventListener('click', async function() {
            const commentContent = document.getElementById('comment-input').value;
            
            if (!commentContent.trim()) {
                alert('댓글 내용을 입력해주세요.');
                return;
            }

            try {
                const response = await fetch(`/api/posts/${postId}/comments`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ content: commentContent })
                });

                if (!response.ok) {
                    throw new Error('댓글 등록 실패');
                }

                const result = await response.json();
                
                // 댓글 목록에 새 댓글 추가
                const commentsList = document.getElementById('comments-list');
                const newComment = document.createElement('div');
                newComment.className = 'comment';

                // 현재 사용자가 작성자이므로 삭제 버튼 표시
                const deleteButton = `<button class="delete-comment" data-comment-id="${result.id}">삭제</button>`;

                newComment.innerHTML = `
                    <p class="comment-content">${result.content}</p>
                    <p class="comment-info">
                        작성자: ${result.author_name} | 
                        작성일: ${new Date(result.created_at).toLocaleString('ko-KR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                        })}
                        ${deleteButton}
                    </p>
                `;

                // 삭제 버튼 이벤트 리스너 추가
                const deleteBtn = newComment.querySelector('.delete-comment');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', async function() {
                        if (confirm('댓글을 삭제하시겠습니까?')) {
                            const commentId = this.dataset.commentId;
                            try {
                                const response = await fetch(`/api/comments/${commentId}`, {
                                    method: 'DELETE'
                                });

                                if (!response.ok) {
                                    throw new Error('댓글 삭제 실패');
                                }

                                // 화면에서 댓글 제거
                                newComment.remove();
                            } catch (error) {
                                console.error('댓글 삭제 중 오류:', error);
                                alert('댓글 삭제에 실패했습니다.');
                            }
                        }
                    });
                }

                commentsList.appendChild(newComment);

                // 입력창 초기화
                document.getElementById('comment-input').value = '';

            } catch (error) {
                console.error('댓글 등록 중 오류:', error);
                alert('댓글 등록에 실패했습니다.');
            }
        });

        // 댓글 목록 표시
        const commentsList = document.getElementById('comments-list');
        commentsList.innerHTML = ''; // 기존 댓글 초기화

        responseData.comments.forEach(comment => {
            const commentElement = document.createElement('div');
            commentElement.className = 'comment';
            
            // 현재 사용자가 댓글 작성자인 경우에만 삭제 버튼 표시
            const deleteButton = currentUser === comment.author ? 
                `<button class="delete-comment" data-comment-id="${comment.id}">삭제</button>` : '';

            commentElement.innerHTML = `
                <p class="comment-content">${comment.content}</p>
                <p class="comment-info">
                    작성자: ${comment.author_name || comment.author} | 
                    작성일: ${new Date(comment.created_at).toLocaleString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                    })}
                    ${deleteButton}
                </p>
            `;

            // 삭제 버튼 이벤트 리스너 추가
            const deleteBtn = commentElement.querySelector('.delete-comment');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', async function() {
                    if (confirm('댓글을 삭제하시겠습니까?')) {
                        const commentId = this.dataset.commentId;
                        try {
                            const response = await fetch(`/api/comments/${commentId}`, {
                                method: 'DELETE'
                            });

                            if (!response.ok) {
                                throw new Error('댓글 삭제 실패');
                            }

                            // 화면에서 댓글 제거
                            commentElement.remove();
                        } catch (error) {
                            console.error('댓글 삭제 중 오류:', error);
                            alert('댓글 삭제에 실패했습니다.');
                        }
                    }
                });
            }

            commentsList.appendChild(commentElement);
        });

        // 추천 버튼 이벤트 리스너
        document.getElementById('like-button').addEventListener('click', async function() {
            try {
                const response = await fetch(`/api/posts/${postId}/like`, {
                    method: 'POST'
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || '추천 실패');
                }

                // 추천 수 업데이트
                const likesElement = document.getElementById('post-likes');
                const currentLikes = parseInt(likesElement.textContent.split(' ')[1]) + 1;
                likesElement.textContent = `추천 ${currentLikes}`;

                // 버튼 비활성화
                this.disabled = true;
                this.style.backgroundColor = '#ccc';
                
                alert('추천되었습니다.');
            } catch (error) {
                console.error('추천 중 오류:', error);
                alert(error.message || '추천에 실패했습니다.');
            }
        });

        // 이벤트 리스너 설정...
    } catch (error) {
        console.error('상세 에러:', error); // 자세한 에러 내용 확인
        alert('게시글을 불러올 수 없습니다.');
        window.location.href = 'general.html';
    }
});

function addComment(text, author) {
    const commentsList = document.getElementById('comments-list');
    const commentDiv = document.createElement('div');
    commentDiv.className = 'comment';
    commentDiv.innerHTML = `
        <div class="comment-header">
            <span class="comment-author">${author}</span>
            <span class="comment-date">${new Date().toLocaleDateString()}</span>
        </div>
        <div class="comment-text">${text}</div>
    `;
    commentsList.appendChild(commentDiv);
}