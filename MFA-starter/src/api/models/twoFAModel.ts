import {model, Schema} from 'mongoose';
import {TwoFA} from '../../types/2FA';

const TwoFASchema = new Schema<TwoFA>({
  // TODO: add userId (Number, required, unique)
  // TODO: add email (String, required, unique)
  // TODO: add twoFactorSecret (String, required)
  // TODO: add twoFactorEnabled (Boolean, default: false)
});

export default model<TwoFA>('TwoFA', TwoFASchema);
