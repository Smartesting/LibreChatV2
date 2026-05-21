import { Document, Schema, Types } from 'mongoose';

export interface ITrainingOrganization extends Omit<Document, 'model'> {
  name: string;
  administrators: Types.ObjectId[];
  trainers: Types.ObjectId[];
}

const trainingOrganizationSchema = new Schema<ITrainingOrganization>(
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
    administrators: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
    trainers: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

trainingOrganizationSchema.pre(/^find/, function (next) {
  // @ts-ignore
  this.populate('administrators', '_id email name role').populate(
    'trainers',
    '_id email name role',
  );
  next();
});

export default trainingOrganizationSchema;
