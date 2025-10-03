// SPDX-License-Identifier: GPL-3.0
/*
    Copyright 2021 0KIMS association.

    This file is generated with [snarkJS](https://github.com/iden3/snarkjs).

    snarkJS is a free software: you can redistribute it and/or modify it
    under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    snarkJS is distributed in the hope that it will be useful, but WITHOUT
    ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public
    License for more details.

    You should have received a copy of the GNU General Public License
    along with snarkJS. If not, see <https://www.gnu.org/licenses/>.
*/

pragma solidity >=0.7.0 <0.9.0;

contract Groth16Verifier {
    // Scalar field size
    uint256 constant r    = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    // Base field size
    uint256 constant q   = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    // Verification Key data
    uint256 constant alphax  = 12141877320069201250054872110806106006899325640181734952524815533230537240677;
    uint256 constant alphay  = 20960839923158536020198994732093035766141854527114116689072561363229817338217;
    uint256 constant betax1  = 3257202973837415214270234248499364817250293278647984551799261952582536980089;
    uint256 constant betax2  = 5112908150821467637925122274057473937814954586187621814179331907110960745278;
    uint256 constant betay1  = 15515982754571159725831776148010389523353477699084878874423686407356515481774;
    uint256 constant betay2  = 16442833089961505179561490478160680132413524004721222490970458882203080682875;
    uint256 constant gammax1 = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
    uint256 constant gammax2 = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
    uint256 constant gammay1 = 4082367875863433681332203403145435568316851327593401208105741076214120093531;
    uint256 constant gammay2 = 8495653923123431417604973247489272438418190587263600148770280649306958101930;
    uint256 constant deltax1 = 18568291772583360892736753653771625333241646828463265988286710093562957760755;
    uint256 constant deltax2 = 15491303155467016925562021883746521925505640567810124781112473775607108921863;
    uint256 constant deltay1 = 1256318254746175590314182563616303714016908509256172081748899710130927570102;
    uint256 constant deltay2 = 18644952561442671173888226455783200202832602862167627512351160001844469775604;

    
    uint256 constant IC0x = 10147900660057577220214172143627626480513302442249276260901003381259230935209;
    uint256 constant IC0y = 21589035771868205747495578002595348835783803810117451347745118795992628965423;
    
    uint256 constant IC1x = 8763131432858586961362802369396687182083859858224166857216418878229844575440;
    uint256 constant IC1y = 970335694037700608125437464559423853117326805566005638569235394291445488815;
    
    uint256 constant IC2x = 8521888476539699559247157238023639221534428126421671984267622596910992903977;
    uint256 constant IC2y = 9492760697555862175675004906743186115458833573997137960278108087780803194506;
    
    uint256 constant IC3x = 4090857447215046397612340386294796456300432447361997414280998982586736265969;
    uint256 constant IC3y = 16810768678218054876276804771877170361268007830817175866671637875012242331505;
    
    uint256 constant IC4x = 6077427666068212488954107684532169665564265538293228868244113776526245937598;
    uint256 constant IC4y = 6156119489580044802743686627929291720827285005315259766603441599179078311726;
    
    uint256 constant IC5x = 1475897143451228375970333825105041001829997400667521465075312856876679966450;
    uint256 constant IC5y = 9289555299637775326056636633091721343032169051893984364477764650485707863177;
    
    uint256 constant IC6x = 3663180750642867603763550852148954070654169189125407989574554931424100134171;
    uint256 constant IC6y = 6384653739424982564078448339339495604314920854249557654032183959362752393109;
    
    uint256 constant IC7x = 17060444096773347647795287701102066420831949349263472375758340432454613617052;
    uint256 constant IC7y = 1885631462397798872813791975427555701857153847093667040409353633447312896177;
    
    uint256 constant IC8x = 7506721033359664055037471952692664533013035092277471931413101199717870418057;
    uint256 constant IC8y = 11577213520561364204339692109243760854704097172960603465499137766479812902953;
    
    uint256 constant IC9x = 4520240353811131144592261978250559409297185921167261428652467017843490987359;
    uint256 constant IC9y = 9631599032460078784438695540109069404281087425141797870862114663910894634855;
    
    uint256 constant IC10x = 18208994572412562639317396929550451850814560606993764972202167007911945620209;
    uint256 constant IC10y = 9284837670874251926065605895701730186601488637694403532432885933648427359178;
    
    uint256 constant IC11x = 14651185712088667772450977087874256299164586698564411135859187734765022642094;
    uint256 constant IC11y = 8721718031589499844555271979390578435432550183057690235649861896893202821239;
    
    uint256 constant IC12x = 16379100988884927230902381964466151432426216557478436009154257378942989660438;
    uint256 constant IC12y = 4573258824697585461342610664965734602146500984155436399065390945748379577529;
    
    uint256 constant IC13x = 4278281967287663167509609546113689797240208249418192614858841287637123788933;
    uint256 constant IC13y = 16947853964208785518590209487019473486298685166961146056270332096362669860900;
    
    uint256 constant IC14x = 4917868416151670944595922869290161811665205512323555862037490915083806082942;
    uint256 constant IC14y = 6106723053936408621826476925053656647556764533700735421007925615694481747376;
    
 
    // Memory data
    uint16 constant pVk = 0;
    uint16 constant pPairing = 128;

    uint16 constant pLastMem = 896;

    function verifyProof(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[14] calldata _pubSignals) public view returns (bool) {
        assembly {
            function checkField(v) {
                if iszero(lt(v, r)) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }
            
            // G1 function to multiply a G1 value(x,y) to value in an address
            function g1_mulAccC(pR, x, y, s) {
                let success
                let mIn := mload(0x40)
                mstore(mIn, x)
                mstore(add(mIn, 32), y)
                mstore(add(mIn, 64), s)

                success := staticcall(sub(gas(), 2000), 7, mIn, 96, mIn, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }

                mstore(add(mIn, 64), mload(pR))
                mstore(add(mIn, 96), mload(add(pR, 32)))

                success := staticcall(sub(gas(), 2000), 6, mIn, 128, pR, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }

            function checkPairing(pA, pB, pC, pubSignals, pMem) -> isOk {
                let _pPairing := add(pMem, pPairing)
                let _pVk := add(pMem, pVk)

                mstore(_pVk, IC0x)
                mstore(add(_pVk, 32), IC0y)

                // Compute the linear combination vk_x
                
                g1_mulAccC(_pVk, IC1x, IC1y, calldataload(add(pubSignals, 0)))
                
                g1_mulAccC(_pVk, IC2x, IC2y, calldataload(add(pubSignals, 32)))
                
                g1_mulAccC(_pVk, IC3x, IC3y, calldataload(add(pubSignals, 64)))
                
                g1_mulAccC(_pVk, IC4x, IC4y, calldataload(add(pubSignals, 96)))
                
                g1_mulAccC(_pVk, IC5x, IC5y, calldataload(add(pubSignals, 128)))
                
                g1_mulAccC(_pVk, IC6x, IC6y, calldataload(add(pubSignals, 160)))
                
                g1_mulAccC(_pVk, IC7x, IC7y, calldataload(add(pubSignals, 192)))
                
                g1_mulAccC(_pVk, IC8x, IC8y, calldataload(add(pubSignals, 224)))
                
                g1_mulAccC(_pVk, IC9x, IC9y, calldataload(add(pubSignals, 256)))
                
                g1_mulAccC(_pVk, IC10x, IC10y, calldataload(add(pubSignals, 288)))
                
                g1_mulAccC(_pVk, IC11x, IC11y, calldataload(add(pubSignals, 320)))
                
                g1_mulAccC(_pVk, IC12x, IC12y, calldataload(add(pubSignals, 352)))
                
                g1_mulAccC(_pVk, IC13x, IC13y, calldataload(add(pubSignals, 384)))
                
                g1_mulAccC(_pVk, IC14x, IC14y, calldataload(add(pubSignals, 416)))
                

                // -A
                mstore(_pPairing, calldataload(pA))
                mstore(add(_pPairing, 32), mod(sub(q, calldataload(add(pA, 32))), q))

                // B
                mstore(add(_pPairing, 64), calldataload(pB))
                mstore(add(_pPairing, 96), calldataload(add(pB, 32)))
                mstore(add(_pPairing, 128), calldataload(add(pB, 64)))
                mstore(add(_pPairing, 160), calldataload(add(pB, 96)))

                // alpha1
                mstore(add(_pPairing, 192), alphax)
                mstore(add(_pPairing, 224), alphay)

                // beta2
                mstore(add(_pPairing, 256), betax1)
                mstore(add(_pPairing, 288), betax2)
                mstore(add(_pPairing, 320), betay1)
                mstore(add(_pPairing, 352), betay2)

                // vk_x
                mstore(add(_pPairing, 384), mload(add(pMem, pVk)))
                mstore(add(_pPairing, 416), mload(add(pMem, add(pVk, 32))))


                // gamma2
                mstore(add(_pPairing, 448), gammax1)
                mstore(add(_pPairing, 480), gammax2)
                mstore(add(_pPairing, 512), gammay1)
                mstore(add(_pPairing, 544), gammay2)

                // C
                mstore(add(_pPairing, 576), calldataload(pC))
                mstore(add(_pPairing, 608), calldataload(add(pC, 32)))

                // delta2
                mstore(add(_pPairing, 640), deltax1)
                mstore(add(_pPairing, 672), deltax2)
                mstore(add(_pPairing, 704), deltay1)
                mstore(add(_pPairing, 736), deltay2)


                let success := staticcall(sub(gas(), 2000), 8, _pPairing, 768, _pPairing, 0x20)

                isOk := and(success, mload(_pPairing))
            }

            let pMem := mload(0x40)
            mstore(0x40, add(pMem, pLastMem))

            // Validate that all evaluations ∈ F
            
            checkField(calldataload(add(_pubSignals, 0)))
            
            checkField(calldataload(add(_pubSignals, 32)))
            
            checkField(calldataload(add(_pubSignals, 64)))
            
            checkField(calldataload(add(_pubSignals, 96)))
            
            checkField(calldataload(add(_pubSignals, 128)))
            
            checkField(calldataload(add(_pubSignals, 160)))
            
            checkField(calldataload(add(_pubSignals, 192)))
            
            checkField(calldataload(add(_pubSignals, 224)))
            
            checkField(calldataload(add(_pubSignals, 256)))
            
            checkField(calldataload(add(_pubSignals, 288)))
            
            checkField(calldataload(add(_pubSignals, 320)))
            
            checkField(calldataload(add(_pubSignals, 352)))
            
            checkField(calldataload(add(_pubSignals, 384)))
            
            checkField(calldataload(add(_pubSignals, 416)))
            

            // Validate all evaluations
            let isValid := checkPairing(_pA, _pB, _pC, _pubSignals, pMem)

            mstore(0, isValid)
             return(0, 0x20)
         }
     }
 }
