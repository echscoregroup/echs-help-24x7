HH WEBSITE ADMIN FACING 1.0.2 — LOCAL REVIEW CANDIDATE

Mapped beneficiary-facing screen:
- index.html in this same package
- Both admin.html preview and standalone index.html load the same beneficiary-facing file.
- This candidate is based on the current index.html supplied from echscoregroup/echs-help-24x7, branch 2.0-development.

Admin functions:
- Feedback Management: local browser draft records and month-wise CSV export.
- News & Improvements: local draft preparation/download only; it does not publish to the website.
- Video Box Management: local draft list only; it does not change the public Video Library or YouTube.

EBVA:
- Beneficiary-facing home box and header tab both open the official EBVA release in a new browser tab.
- Official destination: https://echscoregroup.github.io/EBVA-RELEASE/

Important limitations:
- This is a local review candidate, not a connected secure multi-user administration system.
- Local admin entries are stored in the browser's local storage.
- It is not connected to server, WhatsApp, email, YouTube, live website or GitHub.
- No content is published automatically.
- The tested NEWS publishing route remains separate: news-entry.html prepares the news.md content, which is then updated on the 2.0-development branch using the controlled manual process.
- No GitHub changes have been made by preparing this ZIP.
