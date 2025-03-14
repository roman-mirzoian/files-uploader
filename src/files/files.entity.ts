import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('files')
export class FileEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  googleId: string;

  @Column()
  fileUrl: string;

  @Column()
  fileName: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
