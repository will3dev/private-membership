## Application Overview

This application is designed to operate as a privacy-preserving membership and rewards protocol.

Businesses could employ this protocol as a way of privately registering users for their platform and allowing users to claim loyalty and reward points overtime as a result of being long-standing members.

All of the memberships are private as well as the tracking of membership reward balances. These will be incremented using additive properties of elGamal and validated using poseidon encryption. Similar to eERC.

The mechanism for generating points will be simple. It will be time-based using block timestamp. 

There are two merkle trees being used:

- **Membership Tree**: An append tree that will be used to track memberships of users subscribing to the platform. 
- **Points Tree**: A sparse merkle tree tracking the encrypted balances of the users after they decide to claim points.
