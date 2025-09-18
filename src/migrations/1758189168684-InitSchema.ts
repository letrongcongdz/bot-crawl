import type { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1758189168684 implements MigrationInterface {
    name = 'InitSchema1758189168684'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts" ADD "is_sent" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "is_sent"`);
    }

}
