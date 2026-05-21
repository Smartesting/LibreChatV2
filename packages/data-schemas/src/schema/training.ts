import { Document, Schema, Types } from 'mongoose';

// Define the Trainee schema
const TraineeSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    hasLoggedIn: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

export interface ITraining extends Omit<Document, 'model'> {
  name: string;
  description?: string;
  timezone: string;
  startDateTime: Date;
  endDateTime: Date;
  participantCount: number;
  trainers: Array<Types.ObjectId>;
  trainingOrganizationId: Types.ObjectId;
  location?: string;
  trainees: Array<{
    username: string;
    password: string;
    hasLoggedIn: boolean;
  }>;
}

const trainingSchema = new Schema<ITraining>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      validate: {
        validator: function (value: string): boolean {
          return !!value && value.trim().length > 0;
        },
        message: 'Name cannot be empty',
      },
    },
    description: {
      type: String,
      required: false,
    },
    timezone: {
      type: String,
      required: [true, 'Timezone is required'],
    },
    startDateTime: {
      type: Date,
      required: [true, 'Start date and time is required'],
    },
    endDateTime: {
      type: Date,
      required: [true, 'End date and time is required'],
    },
    participantCount: {
      type: Number,
      required: [true, 'Participant count is required'],
      min: [0, 'Participant count cannot be negative'],
    },
    trainers: {
      type: [Schema.Types.ObjectId],
      ref: 'user',
      default: [],
    },
    trainingOrganizationId: {
      type: Schema.Types.ObjectId,
      ref: 'trainingorganization',
      required: [true, 'Training organization is required'],
    },
    location: {
      type: String,
      required: false,
    },
    trainees: {
      type: [TraineeSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

export default trainingSchema;
