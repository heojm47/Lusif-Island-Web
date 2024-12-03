document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("create-notice-form");

    form.addEventListener("submit", async (event) => {
        event.preventDefault(); // 폼 제출 기본 동작 막기

        // 폼 데이터 가져오기
        const formData = new FormData(form);

        try {
            const response = await fetch("/api/updates", {
                method: "POST",
                body: formData, // FormData를 서버로 전송
            });

            if (response.ok) {
                alert("업데이트가 성공적으로 등록되었습니다.");
                window.location.href = "/src/pages/admin/admin_updates.html"; // 업데이트 목록 페이지로 이동
            } else {
                alert("업데이트 등록에 실패했습니다.");
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            alert("서버 오류 발생");
        }
    });
});
