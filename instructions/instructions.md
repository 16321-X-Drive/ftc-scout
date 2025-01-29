# Instructions

Setting up an FTCScout development environment takes a few steps. This guide will walk you through the process.

## Setting up your database

FTCScout uses a Postgres SQL database. You must set it up separately before running FTCScout.

Example on Ubuntu:

```bash
sudo apt install postgresql-client postgresql
sudo -u postgres createuser ftcscoutuser
sudo -u postgres createdb ftcscoutdb
sudo -u postgres psql ftcscoutdb
  alter user ftcscoutuser with encrypted password 'ftcscoutpassword';
  grant all privileges on database ftcscoutdb to ftcscoutuser;
  grant all privileges on schema public to ftcscoutuser;
  \quit
sudo systemctl restart postgresql
```

## Getting an FTC API key

You must use an FTC Event Web API key to fetch the data used in FTCScout. You can get one by following the instructions [here](https://ftc-events.firstinspires.org/api).

Once you have been emailed your API key, it will be in the format XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX. This key needs to be reformatted for use with FTCScout. First, take the username you used when signing up (it is in the email) and put it to the left to the key, separated by a colon. Then, encode it in Base64.

`exampleusername:XXXX...XXXX` -> `ZXhhbXBsZXVzZX...`

This is the key you will use later when setting up your environment variables.

## Setting up your environment variables

Inside of the `packages/server` directory, duplicate the `.env.example` file and rename it to `.env`. Fill in the relevant fields, including the FTC API key.

You will also need a database connection URL. This should be in the format:

`postgres://PGUSERNAME:PGPASSWORD@localhost:5432/DBNAME`

There is also a field called "frontend code". This is a simple string used to identify to the backend that an API request is coming from the frontend. It can be any string you want, just make sure it matches in the frontend and backend environment variables.

Inside of the `packages/web` directory, duplicate the `.env.example` file and rename it to `.env`. Fill in the relevant fields, including the frontend code.

The "backend origin" field is the URL of the backend server. Example: `localhost:4000`.

## Installing dependencies

Make sure you have Node.js installed.

In the root directory, run `npm install`.

If you get a canvas error, try downgrading to Node 20.

## Running the server

Open three terminal windows side-by-side. You know things are getting serious when you have three terminal windows open. We'll open a fourth later.

In the first terminal window, run `npm run common:watch` in the root directory.

In the second terminal window, run `npm run server:watch` in the root directory.

In the third terminal window, run `npm run server:dev` in the root directory.

In theory, if all goes well, you should see the third terminal window making requests to the FTC API.

This will take a while. Go grab a coffee or something. Hell, grab a 6-course meal. It'll be halfway done by the time you get back. Downloading all the data takes a long time.

## Running the frontend

Once the server has finished downloading all the data, open a fourth terminal window.

Yes, I know, four terminal windows. I didn't even know that was legal!

In the fourth terminal window, run `npm run web:gen` in the root directory.

After that finishes, run `npm run web:dev` in the root directory. It will give you a URL to open in your browser.

You should now see your very own FTCScout instance running on your computer!

## Errors

If you see an `unexpected end of JSON input` error, it means the API key is incorrect.

If you see a `Connection Refused on port 5432` error, it means the database is not running, or your password or database URL is incorrect.

If you have any other issues, come ask us for help on our [Discord](https://discord.gg/XTZhD9RnKa)!
