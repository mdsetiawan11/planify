/*
  Warnings:

  - You are about to drop the `application_doc` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `diagram` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `module_doc` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `note_doc` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `title` to the `meeting_note` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."application_doc" DROP CONSTRAINT "application_doc_applicationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."application_doc" DROP CONSTRAINT "application_doc_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."diagram" DROP CONSTRAINT "diagram_appDocId_fkey";

-- DropForeignKey
ALTER TABLE "public"."module_doc" DROP CONSTRAINT "module_doc_appDocId_fkey";

-- DropForeignKey
ALTER TABLE "public"."note_doc" DROP CONSTRAINT "note_doc_appDocId_fkey";

-- AlterTable
ALTER TABLE "meeting_note" ADD COLUMN     "title" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."application_doc";

-- DropTable
DROP TABLE "public"."diagram";

-- DropTable
DROP TABLE "public"."module_doc";

-- DropTable
DROP TABLE "public"."note_doc";
