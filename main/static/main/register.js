let registerInFlight = false;

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    if (registerInFlight) return;
    registerInFlight = true;

    try {

        const nickname = document.getElementById('nickname').value
        const username = document.getElementById('username').value
        const password = document.getElementById('password').value
        const password2 = document.getElementById('password2').value
        const warning = document.getElementById('warning')

        // валідація 
        if (nickname.length < 3 || nickname.length > 40) {
            warning.innerText = 'Nickname 3-40 characters'
            return
        }

        if (username.length < 3 || username.length > 20) {
            warning.innerText = 'Username 3-20 characters'
            return
        }

        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            warning.innerText = 'Username can only contain latin, numbers and _'
            return
        }

        if (password.length < 6) {
            warning.innerText = 'Password must contain 6 characters'
            return
        } else if (password.length > 40) {
            warning.innerText = 'Password too long'
            return
        }


        if (password !== password2) {
            warning.innerText = 'Passwords don\'t match'
            return
        }

        // все ок — відправляємо на сервер
        const csrf = document.cookie.split('; ').find(row => row.startsWith('csrftoken=')).split('=')[1]
        const res = await fetch('/register/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrf
            },
            body: JSON.stringify({ nickname, username, password, password2 })
        })
        const data = await res.json()

        if (data.error) {
            warning.innerText = data.error;  //user exists
        } else {
            window.location.href = '/dashboard/';
        }
    } catch (err) {
        console.log("REGISTER ERROR: ", err);
    } finally {
        registerInFlight = false;
    }
})