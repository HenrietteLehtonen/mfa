import {LoginResponse, UserResponse} from '@sharedTypes/MessageTypes';
import {TokenContent, User, UserWithLevel} from '@sharedTypes/DBTypes';
import CustomError from '../../classes/CustomError';
import {Request, Response, NextFunction} from 'express';
import fetchData from '../../utils/fetchData';
import OTPAuth from 'otpauth';
import twoFAModel from '../models/twoFAModel';
import QRCode from 'qrcode';
import jwt from 'jsonwebtoken';

// Define setupTwoFA function
// POST
const setupTwoFA = async (
  req: Request<{}, {}, User>,
  res: Response<{qrCodeUrl: string}>,
  next: NextFunction,
) => {
  try {
    //Register user to AUTH API
    const options: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    };
    const userResponse = await fetchData<UserResponse>(
      process.env.AUTH_URL + '/api/v1/users',
      options,
    );
    console.log('user', userResponse);

    // Generate a new 2FA secret
    const secret = new OTPAuth.Secret();

    // Create the TOTP instance
    const totp = new OTPAuth.TOTP({
      issuer: 'MyApp',
      label: userResponse.user.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: secret,
    });

    // Store the 2FA data in the database
    await twoFAModel.create({
      email: userResponse.user.email,
      userId: userResponse.user.user_id,
      twoFactorEnabled: true,
      twoFactorSecret: secret.base32,
    });
    // Generate a QR code and send it in the response
    const imageUrl = await QRCode.toDataURL(totp.toString());
    res.json({qrCodeUrl: imageUrl});
  } catch (error) {
    next(new CustomError((error as Error).message, 500));
  }
};

// Define verifyTwoFA function
const verifyTwoFA = async (
  req: Request<{}, {}, {email: string; code: string}>,
  res: Response<LoginResponse>,
  next: NextFunction,
) => {
  const {email, code} = req.body;
  console.log(email, code);

  try {
    //  Retrieve 2FA data from the database // findOne koska yhden käyttäjän tiedot
    const twoFactorData = await twoFAModel.findOne({email});
    // Validate the 2FA code
    if (!twoFactorData) {
      return next(new CustomError('2FA data not found', 400));
    }

    const totp = new OTPAuth.TOTP({
      issuer: 'MyApp',
      label: email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(twoFactorData.twoFactorSecret),
    });
    // If valid, get the user from AUTH API
    const isValid = totp.validate({token: code, window: 1});
    //not valid
    if (isValid === null) {
      next(new CustomError('Invalid code', 400));
      return;
    }

    const userResponse = await fetchData<UserWithLevel>(
      `${process.env.AUTH_URL}/api/v1/users/${twoFactorData.userId}`,
    );
    if (!userResponse) {
      next(new CustomError('User not found', 401));
      return;
    }
    // Create and return a JWT token
    const tokenContent: TokenContent = {
      user_id: userResponse.user_id,
      level_name: userResponse.level_name,
    };
    if (!process.env.JWT_SECRET) {
      next(new CustomError('Missing JWT_SECRET', 500));
      return;
    }
    const token = jwt.sign(tokenContent, process.env.JWT_SECRET);
    const loginResponse: LoginResponse = {
      user: userResponse,
      token: token,
      message: 'Login successful',
    };
    res.json(loginResponse);
  } catch (error) {
    next(new CustomError((error as Error).message, 500));
  }
};

export {setupTwoFA, verifyTwoFA};
