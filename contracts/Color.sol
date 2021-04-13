// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import '@openzeppelin/contracts/token/ERC721/presets/ERC721PresetMinterPauserAutoId.sol';

contract Color is ERC721PresetMinterPauserAutoId {

  bytes3[] public colors;
  mapping(bytes3 => bool) private _colorExists;

  constructor() ERC721PresetMinterPauserAutoId("color", "COLOR", "https://richardanchieta.com") {
    
  }

  // E.G. color = "#FFFFFF"
  function mint(bytes3 _color) public {
    require(!_colorExists[_color], "color exists");
    colors.push(_color);
    mint(msg.sender);
    _colorExists[_color] = true;
  }
}