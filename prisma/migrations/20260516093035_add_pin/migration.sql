-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Announcement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "category" TEXT NOT NULL,
    "contactInfo" TEXT NOT NULL,
    "pin" TEXT NOT NULL DEFAULT '0000',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Announcement" ("category", "contactInfo", "createdAt", "description", "id", "price", "title") SELECT "category", "contactInfo", "createdAt", "description", "id", "price", "title" FROM "Announcement";
DROP TABLE "Announcement";
ALTER TABLE "new_Announcement" RENAME TO "Announcement";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
