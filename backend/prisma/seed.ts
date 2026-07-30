import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@alienos.dev";
  const passwordHash = await bcrypt.hash("password123", 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      profile: { create: { name: "Alien", role: "Social Media Manager", email } },
      appearanceSettings: { create: {} },
      visualEffectsSettings: { create: {} },
      notificationSettings: { create: {} },
      preferenceSettings: { create: {} },
      aiSettings: { create: {} },
    },
  });

  await prisma.task.createMany({
    data: [
      { userId: user.id, title: "Draft Facebook captions for the weekend fixtures", category: "Content", priority: "high" },
      { userId: user.id, title: "Edit Yamal highlight Short in CapCut", category: "YouTube", priority: "medium" },
      { userId: user.id, title: "Review thesis defense deck for Ibrahim", category: "Academic", priority: "medium" },
    ],
    skipDuplicates: true,
  });

  await prisma.note.createMany({
    data: [
      {
        userId: user.id,
        title: "Alien Footy caption formula",
        content: "Only #AlienFooty. Natural 'Follow Alien Footy' CTA. Cinematic hook in the first line.",
        color: "blue",
        pinned: true,
      },
    ],
    skipDuplicates: true,
  });

  const account = await prisma.account.create({
    data: { userId: user.id, name: "Main Wallet", type: "digitalWallet", currency: "NGN", balance: 50000, openingBalance: 50000 },
  });

  await prisma.transaction.create({
    data: {
      userId: user.id,
      type: "expense",
      amount: 5000,
      category: "Software",
      accountId: account.id,
      date: new Date(),
      notes: "ElevenLabs subscription",
    },
  });

  const goal = await prisma.goal.create({
    data: {
      userId: user.id,
      title: "Grow Alien Footy YouTube to 10k subscribers",
      category: "Content Growth",
      priority: "high",
      status: "inProgress",
    },
  });

  await prisma.milestone.createMany({
    data: [
      { goalId: goal.id, title: "Publish 30 Shorts", completed: true },
      { goalId: goal.id, title: "Publish first long-form storytelling video", completed: true },
      { goalId: goal.id, title: "Hit 1,000 subscribers", completed: false },
    ],
  });

  // eslint-disable-next-line no-console
  console.log(`Seeded demo user: ${email} / password123`);
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
