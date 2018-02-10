FROM node:latest

WORKDIR /nodeapp

COPY package*.json ./

RUN npm install && npm update

COPY . .

RUN ["/bin/bash", "-c", "openssl genrsa -out key.pem" ]
RUN ["/bin/bash", "-c", "openssl req -new -key key.pem -out csr.pem -subj \"/C=/ST=/L=/O=/CN=MyCert\" " ]
RUN ["/bin/bash", "-c", "openssl x509 -req -days 9999 -in csr.pem -signkey key.pem -out cert.pem" ]
RUN ["/bin/bash", "-c", "curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.8/install.sh | bash" ]
RUN ["/bin/bash", "-c", ". /root/.nvm/nvm.sh install 7.4.0" ]


EXPOSE 443

RUN npm install --save method-override express-session passport passport-azure-ad

CMD [ "npm", "start", "app.js" ]
