const { find, filter } = require('lodash');
const { ApolloServer, gql, PubSub } = require('apollo-server-express');
const { createServer } = require('http');
const express = require('express');

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
const app = express();

const pubsub = new PubSub();
const MISSION_CREATED = 'MISSION_CREATED';

const users = [
  { id: 1, name: 'Donghee Park', hobby: 'yoga', profilePicture: 'donghee.png', vehicles: [1, 3]},
  { id: 2, name: 'Hwayong Kim', hobby: 'yoha', profilePicture: 'circus.png', vehicles: [2, 3]},
];

const vehicles = [
  { id: 1, name: 'Dronemap F450 Test Frame 1', uuid: 'dronemap-donghee', fc: 'PX4', protocol: 'mavlink', profilePicture: 'f450.png', missions: [1,2]},
  { id: 2, name: 'Dronemap F450 Test Frame 2', uuid: 'dronemap-doojin', fc: 'PX4', protocol: 'mavlink', profilePicture: 'f450.png', missions: [2] }
];

const missions = [
  { id: 1, name: 'Untitle 1', createdAt: '.', waypoints: [ {type: 'TAKEOFF', lat: 128.0, lon: 36.0, alt: 15.0}, {type: 'WAYPOINT', lat: 128.0, lon: 36.0, alt: 15.0}, {type: 'LAND', lat: 128.0, lon: 36.0, alt: 15.0} ]},
  { id: 2, name: 'Untitle 2', createdAt: '..', waypoints: [ {type: 'TAKEOFF', lat: 128.4, lon: 36.9, alt: 15.0}, {type: 'WAYPOINT', lat: 128.4, lon: 36.9, alt: 15.0}, {type: 'LAND', lat: 128.0, lon: 36.0, alt: 15.0} ]},
];

const typeDefs = gql`
  type User {
    id: Int
    name: String
    hobby: String
    profilePicture: String
    vehicles: [Int]
  }
  type Vehicle {
    id: Int
    name: String
    uuid: String
    fc: String
    protocol: String
    profilePicture: String
    missions: [Int]
  }

  type Mission {
    id: Int
    name: String
    createdAt: String
  }

  type Query {
    users: [User]
    user(id: Int!): User
    userByVehicle(id: Int!): [User]
    missions: [Mission]
  }
  type Subscription {
    missionCreated: Mission
  }
`

const resolvers = {
  Query: {
    users: () => users,
    user: (parent, args, context, info) => find(users, { id: args.id }),
    userByVehicle: (parent, args, context, info) => filter(users, (user) => user.vehicles.includes(args.id)),
    missions: () => missions,
  },
  Subscription: {
    missionCreated: {
      subscribe: () => pubsub.asyncIterator(MISSION_CREATED),
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

const httpServer = createServer(app);
server.installSubscriptionHandlers(httpServer);
server.applyMiddleware({ app });

httpServer.listen({ port: 4000 }, () =>
  console.log(`🚀  Server ready at http://localhost:4000${server.graphqlPath}`)
);

let id = 2;

setInterval(() => {
  pubsub.publish(MISSION_CREATED, {
    missionCreated: 
      { id: id, name: `Mission ${id}`, createdAt: new Date().toString() }
  });
  id++;
}, 1000);
