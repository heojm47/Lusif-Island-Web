document.addEventListener('DOMContentLoaded', () => {
    const myPageButton = document.getElementById('mypage-button');
    if (myPageButton) {
        myPageButton.addEventListener('click', () => {
            window.location.href = '/src/pages/my-page.html'; // my-page.html로 이동
        });
    }
});