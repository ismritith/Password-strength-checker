/**
 * Common shared scripts for the registration and login pages.
 *
 * - Handles password strength feedback.
 * - Handles password visibility toggles.
 * - Handles AJAX form submission with consistent JSON expectations.
 */

/**
 * Returns a strength assessment for the given password.
 *
 * @param {string} password
 * @returns {{level: 'invalid'|'weak'|'medium'|'strong', message: string, suggestions: string[]}}
 */
function getPasswordStrength(password) {
  if (!password) {
    return { level: 'invalid', message: '', suggestions: [] };
  }

  if (/[()":]/.test(password)) {
    return {
      level: 'invalid',
      message: 'Password contains forbidden characters ( ) " :',
      suggestions: [],
    };
  }

  const hasSpecial = /[#$%@!&*]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const length = password.length;

  const suggestions = [];
  if (!hasUpper) suggestions.push('use an uppercase letter');
  if (!hasNumber) suggestions.push('use a number');
  if (!hasSpecial) suggestions.push('use a special character (e.g. #, $, %, @, !, &, *)');
  if (length < 8) suggestions.push('make it at least 8 characters long');

  if (hasSpecial && hasNumber && hasUpper && length >= 8) {
    return {
      level: 'strong',
      message: 'Password strength: Strong',
      suggestions: [],
    };
  }

  if ((hasNumber || hasUpper) && length >= 6) {
    return {
      level: 'medium',
      message: 'Password strength: Medium',
      suggestions,
    };
  }

  return {
    level: 'weak',
    message: 'Password strength: Weak',
    suggestions,
  };
}

function updatePasswordStrengthUI(password) {
  const strengthEl = document.getElementById('passwordStrengthText');
  const suggestionEl = document.getElementById('passwordSuggestionText');
  if (!strengthEl || !suggestionEl) return;

  const { level, message, suggestions } = getPasswordStrength(password);
  strengthEl.textContent = message;

  if (level === 'strong') {
    strengthEl.style.color = 'green';
    suggestionEl.textContent = 'Great! Your password is strong.';
  } else if (level === 'medium') {
    strengthEl.style.color = 'orange';
    suggestionEl.textContent = suggestions.length ? `To improve your password, ${suggestions.join(', ')}.` : '';
  } else if (level === 'weak') {
    strengthEl.style.color = 'red';
    suggestionEl.textContent = suggestions.length ? `Try to ${suggestions.join(', ')}.` : '';
  } else {
    strengthEl.style.color = 'red';
    suggestionEl.textContent = '';
  }
}

function togglePasswordVisibility(inputId, iconId) {
  const input = document.getElementById(inputId);
  const icon = document.getElementById(iconId);
  if (!input || !icon) return;

  if (input.type === 'password') {
    input.type = 'text';
    icon.classList.replace('fa-eye-slash', 'fa-eye');
  } else {
    input.type = 'password';
    icon.classList.replace('fa-eye', 'fa-eye-slash');
  }
}

function showAlert(type, message) {
  const errorAlert = document.getElementById('errorAlert');
  const successAlert = document.getElementById('successAlert');

  if (!errorAlert || !successAlert) return;

  errorAlert.style.display = 'none';
  successAlert.style.display = 'none';

  if (type === 'error') {
    errorAlert.textContent = message;
    errorAlert.style.display = 'block';
    return;
  }

  successAlert.textContent = message;
  successAlert.style.display = 'block';
}

function initRegisterForm() {
  const form = document.getElementById('registerForm');
  if (!form) return;

  const submitButton = document.getElementById('submitButton');
  const passwordInput = document.getElementById('password');

  if (passwordInput) {
    passwordInput.addEventListener('input', (event) => {
      updatePasswordStrengthUI(event.target.value);
    });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const firstName = form.querySelector('#firstName')?.value.trim();
    const lastName = form.querySelector('#lastName')?.value.trim();
    const email = form.querySelector('#email')?.value.trim();
    const password = form.querySelector('#password')?.value || '';
    const confirmPassword = form.querySelector('#confirmPassword')?.value || '';

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      showAlert('error', 'All fields are required.');
      return;
    }

    if (password !== confirmPassword) {
      showAlert('error', 'Passwords do not match.');
      return;
    }

    const { level, suggestions } = getPasswordStrength(password);
    if (level === 'invalid' || level === 'weak') {
      showAlert('error', `Please choose a stronger password.${suggestions.length ? ' ' + suggestions.join(', ') : ''}`);
      return;
    }

    const grecaptchaEl = document.querySelector('.g-recaptcha');
    if (grecaptchaEl && typeof grecaptcha !== 'undefined') {
      const captchaResponse = grecaptcha.getResponse();
      if (!captchaResponse) {
        showAlert('error', 'Please complete the captcha.');
        return;
      }
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Signing Up...';
    }

    const formData = new FormData(form);

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        showAlert('success', data.message || 'Registration successful! You can now log in.');
        form.reset();
        updatePasswordStrengthUI('');
        if (typeof grecaptcha !== 'undefined') {
          grecaptcha.reset();
        }
      } else {
        showAlert('error', data.message || 'Registration failed.');
      }
    } catch (err) {
      showAlert('error', 'A network error occurred. Please try again.');
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Sign Up';
      }
    }
  });
}

function initLoginForm() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  const submitButton = document.getElementById('submitButton');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = form.querySelector('#email')?.value.trim();
    const password = form.querySelector('#password')?.value || '';

    if (!email || !password) {
      Swal.fire({ icon: 'error', title: 'Missing Fields', text: 'Email and password are required.' });
      return;
    }

    const grecaptchaEl = document.querySelector('.g-recaptcha');
    if (grecaptchaEl && typeof grecaptcha !== 'undefined') {
      const captchaResponse = grecaptcha.getResponse();
      if (!captchaResponse) {
        Swal.fire({ icon: 'warning', title: 'Captcha Required', text: 'Please complete the captcha before logging in.' });
        return;
      }
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Logging In...';
    }

    const formData = new FormData(form);

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        Swal.fire({ icon: 'success', title: 'Login successful', text: data.message || 'Redirecting...' });
        setTimeout(() => {
          window.location.href = data.redirect || '../index.php';
        }, 1300);
      } else {
        Swal.fire({ icon: 'error', title: 'Login Failed', text: data.message || 'Invalid email or password.' });
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Oops...', text: 'Something went wrong. Please try again.' });
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Login';
      }
    }
  });
}

function initLogoutConfirmation() {
  const logoutLinks = document.querySelectorAll('a[href$="logout.php"]');
  if (!logoutLinks.length) return;

  logoutLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      Swal.fire({
        title: 'Are you sure you want to logout?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, logout',
        cancelButtonText: 'Cancel',
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = link.href;
        }
      });
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initRegisterForm();
  initLoginForm();
  initLogoutConfirmation();
});


//http://localhost/password-strength-checker/front/login.html 
//this port is required to do registeration as the db is handled by xampp. and while just normally hosting the site will not work as there would be no db connection between the static site and actual working site, even if it is locally hosted. it still requires a kind of server and db connection to work properly.
//got it? umm, tara mero dashboard pahia ni yestai thiyo. xampp install garda feri k ho welcome page wala file delete garna parthyo k, i forgot kun chai ho so i was searching looking from my own. umm abaa k garni 
//now let;s test the registeration functionality 