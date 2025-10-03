pragma solidity ^0.8.0;

import { PointsBalance } from "../types/EncryptedMembershipTypes.sol";

interface IEncryptedLoyaltyPoints {
   function addNewPointsBalance(
        bytes32 leaf,
        PointsBalance calldata balance
   ) external;
}