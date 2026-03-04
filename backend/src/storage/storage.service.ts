import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class StorageService {
    private s3Client: S3Client;
    private bucket: string;

    constructor(private configService: ConfigService) {
        this.s3Client = new S3Client({
            endpoint: `https://${this.configService.get<string>('DO_SPACES_ENDPOINT')}`,
            region: this.configService.get<string>('DO_SPACES_REGION'),
            credentials: {
                accessKeyId: this.configService.get<string>('DO_SPACES_KEY')!,
                secretAccessKey: this.configService.get<string>('DO_SPACES_SECRET')!,
            },
        });
        this.bucket = this.configService.get<string>('DO_SPACES_BUCKET')!;
    }

    async uploadFile(file: Express.Multer.File, folder: string = 'pdfs'): Promise<{ url: string; key: string }> {
        const key = `${folder}/${Date.now()}-${file.originalname}`;

        await this.s3Client.send(
            new PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                Body: file.buffer,
                ACL: 'public-read',
                ContentType: file.mimetype,
            }),
        );

        // DigitalOcean Spaces URL format
        const url = `https://${this.bucket}.${this.configService.get<string>('DO_SPACES_ENDPOINT')}/${key}`;

        return { url, key };
    }

    async deleteFile(key: string): Promise<void> {
        await this.s3Client.send(
            new DeleteObjectCommand({
                Bucket: this.bucket,
                Key: key,
            }),
        );
    }
}
