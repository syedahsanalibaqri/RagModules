import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';

export default function useCaptchaSubmit() {
  const { executeRecaptcha } = useGoogleReCaptcha();

  return async (action) => {
    if (!executeRecaptcha) {
      throw new Error(
        'Captcha not ready. Please refresh the page or disable ad blockers.'
      );
    }

    let token;
    try {
      token = await executeRecaptcha(action);
    } catch (err) {
      console.error('reCAPTCHA execution failed:', err);
      throw new Error(
        'Captcha could not load. Refresh the page or disable ad blockers and try again.'
      );
    }

    if (!token) {
      throw new Error('Captcha verification failed. Please try again.');
    }
    return token;
  };
}
