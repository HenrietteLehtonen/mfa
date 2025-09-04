import { Button } from "./ui/button";

const Setup2FA = (props: { qrCodeUrl: string; switchForm: () => void }) => {
  return (
    <div className="p-4">
      {
        // add image element with qrCodeUrl as src and a Button with switchForm function
        <>
          <img
            src={props.qrCodeUrl}
            alt="Authenticator QR Code"
            className="mx-auto mb-4"
          />
          <Button onClick={props.switchForm}>
            Press here to go back when qr code is scanned
          </Button>
        </>
      }
    </div>
  );
};

export default Setup2FA;
