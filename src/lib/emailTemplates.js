export function userTemplate({ name, courseTitle, refNo }) {
  return {
    subject: "We received your registration",
    html: `
      <h2>Thank you for your interest</h2>
      <p>Dear ${name || "Customer"},</p>
      <p>We have received your registration for <b>${courseTitle}</b>.</p>
      <p><b>Reference No:</b> ${refNo}</p>
      <p>Our team will contact you shortly.</p>
      <br/>
      <p>Next Skills Team</p>
    `,
    text: `We received your registration for ${courseTitle}. Ref: ${refNo}`,
  };
}

export function adminTemplate({ name, email, courseTitle, refNo }) {
  return {
    subject: "New registration received",
    html: `
      <h2>New Registration</h2>
      <ul>
        <li><b>Name:</b> ${name}</li>
        <li><b>Email:</b> ${email}</li>
        <li><b>Course:</b> ${courseTitle}</li>
        <li><b>Ref:</b> ${refNo}</li>
      </ul>
    `,
    text: `New registration: ${name}, ${email}, ${courseTitle}, Ref ${refNo}`,
  };
}
