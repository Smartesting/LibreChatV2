import { Document, Schema, Types } from 'mongoose';

export interface IInvitation extends Omit<Document, 'model'> {
  email: string;
  invitationTokens: string[];
  roles: {
    superAdmin: boolean;
    orgAdmin: Types.ObjectId[];
    orgTrainer: Types.ObjectId[];
  };
}

const invitationSchema = new Schema<IInvitation>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, 'is invalid'],
      index: true,
      unique: true,
    },
    invitationTokens: {
      type: [String],
      required: true,
    },
    roles: {
      type: {
        superAdmin: Boolean,
        orgAdmin: {
          type: [Schema.Types.ObjectId],
          ref: 'TrainingOrganization',
        },
        orgTrainer: {
          type: [Schema.Types.ObjectId],
          ref: 'TrainingOrganization',
        },
      },
      required: true,
    },
  },
  { timestamps: true },
);

export default invitationSchema;
