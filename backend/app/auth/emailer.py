import os
import smtplib
from email.message import EmailMessage

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER)

APP_PUBLIC_URL = os.getenv("APP_PUBLIC_URL", "http://localhost:3000")


def send_verification_email(to_email: str, token: str):
    if not SMTP_HOST:
        link = f"{APP_PUBLIC_URL}/verify?token={token}"
        print(f"[DEV] Verify link for {to_email}: {link}")
        return

    link = f"{APP_PUBLIC_URL}/verify?token={token}"

    msg = EmailMessage()
    msg["Subject"] = "Verify your FTS Questionnaire account"
    msg["From"] = SMTP_FROM
    msg["To"] = to_email
    msg.set_content(
        f"Please verify your account by clicking this link:\n\n{link}\n\n"
        "If you did not request this, you can ignore this email."
    )

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.send_message(msg)

def send_password_reset_email(to_email: str, token: str):
    if not SMTP_HOST:
        link = f"{APP_PUBLIC_URL}/reset-password?token={token}"
        print(f"[DEV] Reset link for {to_email}: {link}")
        return


    link = f"{APP_PUBLIC_URL}/reset-password?token={token}"

    msg = EmailMessage()
    msg["Subject"] = "Reset your FTS Questionnaire password"
    msg["From"] = SMTP_FROM
    msg["To"] = to_email
    msg.set_content(
        f"To reset your password, click this link:\n\n{link}\n\n"
        "If you did not request this, you can ignore this email."
    )

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.send_message(msg)
