import bcrypt from "bcryptjs";
import { connectDb } from "../db.js";
import { User } from "../models/User.js";
import { Form } from "../models/Form.js";
import { generateFormRef } from "../utils/ticketNumber.js";

async function seed() {
  await connectDb();

  const accounts = [
    { email: "admin@nmp.gov.ph", password: "admin123", name: "Ysa Victorio", role: "admin" as const, division: "ICT" },
    { email: "user@nmp.gov.ph", password: "user123", name: "J Dela Cruz", role: "user" as const, division: "FMD" },
    { email: "records@nmp.gov.ph", password: "records123", name: "Record Management", role: "record_management" as const, division: "Records" },
  ];

  await User.deleteMany({ role: "staff" });

  let adminUser = null;
  for (const account of accounts) {
    const passwordHash = await bcrypt.hash(account.password, 10);
    let user = await User.findOne({ email: account.email });
    if (user) {
      user.passwordHash = passwordHash;
      user.name = account.name;
      user.role = account.role;
      user.division = account.division;
      user.active = true;
      await user.save();
      console.log(`Updated: ${account.email} (${account.role})`);
    } else {
      user = await User.create({ ...account, passwordHash });
      console.log(`Created: ${account.email} (${account.role})`);
    }
    if (account.role === "admin") adminUser = user;
  }

  // Migrate old "live" forms to "published"
  await Form.updateMany({ status: "live" }, { status: "published" });

  const publishedExists = await Form.findOne({ status: "published" });
  if (!publishedExists && adminUser) {
    await Form.create({
      title: "Technical Assistance Request",
      description: "Request technical assistance from ICT",
      department: "ICT",
      refNumber: generateFormRef(),
      effectivity: new Date().toISOString().slice(0, 10),
      version: "v1.0",
      status: "published",
      fields: [
        { id: "fld_subject", type: "textbox", variable: "txt_subject", label: "Request subject", required: true },
        { id: "fld_details", type: "textarea", variable: "txa_details", label: "Request details", required: true },
        { id: "fld_division", type: "textbox", variable: "txt_division", label: "Division / office", required: true },
        { id: "fld_attachment", type: "file", variable: "pdf_attachment", label: "Supporting document (PDF)", required: false },
      ],
      signatories: [{ id: "sig_1", division: "IT", name: "Ysa Victorio" }],
      createdBy: adminUser._id,
      updatedBy: adminUser._id,
    });
    console.log("Created: published Technical Assistance Request form");
  } else {
    console.log("Skip existing: published form");
  }

  console.log("Seed complete");
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
