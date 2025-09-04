import {model, Schema} from 'mongoose';
import {TwoFA} from '../../types/2FA';

const TwoFASchema = new Schema<TwoFA>({
  // autentikointipalvelimella oleva id
  userId: {
    type: Number,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  twoFactorSecret: {
    type: String,
    required: true,
  },
  // ei vältsisti tarvita, jos twoFactorSecret on tehty
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },
});

export default model<TwoFA>('TwoFA', TwoFASchema);
