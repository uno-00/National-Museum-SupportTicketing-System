import bcrypt from "bcryptjs";
import { connectDb } from "../db.js";
import { User } from "../models/User.js";
import { Form } from "../models/Form.js";
import { generateFormRef } from "../utils/ticketNumber.js";

async function seed() {
  await connectDb();

  const clientUsers = [
    { email: "user@nmp.gov.ph", password: "user123", name: "J Dela Cruz", division: "FMD" },
    { email: "maria.santos@nmp.gov.ph", password: "user123", name: "Maria Santos", division: "Collections" },
    { email: "juan.reyes@nmp.gov.ph", password: "user123", name: "Juan Reyes", division: "Anthropology" },
    { email: "ana.garcia@nmp.gov.ph", password: "user123", name: "Ana Garcia", division: "Archaeology" },
    { email: "carlo.mendoza@nmp.gov.ph", password: "user123", name: "Carlo Mendoza", division: "Botany" },
    { email: "elena.ramos@nmp.gov.ph", password: "user123", name: "Elena Ramos", division: "Geology" },
    { email: "mark.torres@nmp.gov.ph", password: "user123", name: "Mark Torres", division: "Zoology" },
    { email: "sophia.lim@nmp.gov.ph", password: "user123", name: "Sophia Lim", division: "Fine Arts" },
    { email: "diego.navarro@nmp.gov.ph", password: "user123", name: "Diego Navarro", division: "Maritime" },
    { email: "isabel.cruz@nmp.gov.ph", password: "user123", name: "Isabel Cruz", division: "Library" },
    { email: "patrick.ong@nmp.gov.ph", password: "user123", name: "Patrick Ong", division: "HR" },
    { email: "grace.villanueva@nmp.gov.ph", password: "user123", name: "Grace Villanueva", division: "Finance" },
    { email: "miguel.fernandez@nmp.gov.ph", password: "user123", name: "Miguel Fernandez", division: "Security" },
    { email: "camille.bautista@nmp.gov.ph", password: "user123", name: "Camille Bautista", division: "Education" },
    { email: "rafael.dizon@nmp.gov.ph", password: "user123", name: "Rafael Dizon", division: "Exhibitions" },
  ] as const;

  const adminUsers = [
    { email: "admin@nmp.gov.ph", password: "admin123", name: "Ysa Victorio", division: "ICT" },
    { email: "james.alcantara@nmp.gov.ph", password: "admin123", name: "James Alcantara", division: "ICT" },
    { email: "patricia.mendoza@nmp.gov.ph", password: "admin123", name: "Patricia Mendoza", division: "ICT" },
    { email: "rico.delarosa@nmp.gov.ph", password: "admin123", name: "Rico Dela Rosa", division: "ICT" },
    { email: "nina.castillo@nmp.gov.ph", password: "admin123", name: "Nina Castillo", division: "ICT" },
  ] as const;

  const accounts = [
    ...adminUsers.map((admin) => ({ ...admin, role: "admin" as const })),
    { email: "records@nmp.gov.ph", password: "records123", name: "Record Management", role: "record_management" as const, division: "Records" },
    ...clientUsers.map((client) => ({ ...client, role: "user" as const })),
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
