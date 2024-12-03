document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("create-notice-form");

    form.addEventListener("submit", async (event) => {
        event.preventDefault(); // 기본 폼 제출 방지

        const formData = new FormData(form);

        try {
            const response = await fetch("/api/notices", {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                const result = await response.json();
                alert("공지사항이 성공적으로 등록되었습니다!"); // 공지사항 등록 완료 메시지
                console.log("등록 결과:", result);

                // 등록 완료 후 바로 페이지 이동
                window.location.href = "/src/pages/admin/admin_notices.html";
            } else {
                const error = await response.json();
                alert(`등록 실패: ${error.message}`);
            }
        } catch (err) {
            console.error("공지사항 등록 중 오류:", err);
            alert("서버 오류로 인해 등록에 실패했습니다.");
        }
    });
});
