/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AddForsionUserMapping1770000000000 {
    name = 'AddForsionUserMapping1770000000000'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "forsion_user_mapping" ("id" character varying(32) NOT NULL, "forsionUserId" character varying(128) NOT NULL, "misskeyUserId" character varying(32) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "lastLoginAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_forsion_user_mapping" PRIMARY KEY ("id"))`);
        await queryRunner.query(`COMMENT ON COLUMN "forsion_user_mapping"."forsionUserId" IS 'Forsion user ID from JWT token'`);
        await queryRunner.query(`COMMENT ON COLUMN "forsion_user_mapping"."createdAt" IS 'Timestamp when the mapping was created'`);
        await queryRunner.query(`COMMENT ON COLUMN "forsion_user_mapping"."lastLoginAt" IS 'Timestamp when the user last logged in via Forsion'`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_forsion_user_mapping_forsionUserId" ON "forsion_user_mapping" ("forsionUserId")`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_forsion_user_mapping_misskeyUserId" ON "forsion_user_mapping" ("misskeyUserId")`);
        await queryRunner.query(`ALTER TABLE "forsion_user_mapping" ADD CONSTRAINT "FK_forsion_user_mapping_misskeyUserId" FOREIGN KEY ("misskeyUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "forsion_user_mapping" DROP CONSTRAINT "FK_forsion_user_mapping_misskeyUserId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_forsion_user_mapping_misskeyUserId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_forsion_user_mapping_forsionUserId"`);
        await queryRunner.query(`DROP TABLE "forsion_user_mapping"`);
    }
}
