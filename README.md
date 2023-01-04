<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

## 요구 사항
### 매체(Media)
- 매체는 물리적 플레이어 디바이스의 논리적 묶음이며 따라서 여러 개의 해상도를 가진다.
- 일부 데이터를 변경하게 되더라도 기존 데이터를 유지해야 한다.  
natural key(`mdmId`)와 version number(`version`)로 관리한다.
  - `mdmId`와 `version` 조합은 unique.
- soft delete
  - 이미 삭제 처리된 레코드는 저장되어 있지 않은 것으로 간주하여 삭제 재 요청 시 404 Not Found로 응답한다.
- 저장 시 동일한 natural key(`mdmId`)를 가진 데이터가 이미 저장되어 있다면 저장하지 않는다.
  - 단, 삭제 처리된 레코드는 저장되어 있지 않은 것으로 간주하여 natural key 중복으로 판단하지 않는다.
  - unique constraint([ `mdmId`, `version` ])에 위배되지 않도록 삭제 처리된 레코드까지 고려하여 `version` 값을 할당한다.
  - 해상도 데이터를 같이 받아서, 저장되어 있지 않은 해상도를 저장하고, 매체-해상도 매핑 정보를 저장한다.
- 목록 조회 시 natural key별로 version number가 가장 높은 것들을 반환한다.
  - 삭제 처리된 레코드는 저장되어 있지 않은 것으로 간주하여 반환하지 않는다.
- 조회 모델 구성 시 해상도 ID만이 아닌 상세 데이터까지 포함한다.

### 해상도(Resolution)
- 매체에 속한 플레이어 디바이스의 해상도가 파편화되면 안 되는 비즈니스 특성상 해상도를 매체의 값 객체가 아닌 별도의 애그리거트 루트로 관리한다.

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://kamilmysliwiec.com)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](LICENSE).
