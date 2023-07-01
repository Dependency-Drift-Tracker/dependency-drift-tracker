import { expect } from 'chai';
import sinon from 'sinon';
import {
  parseRepositoryLine,
  cloneRepository,
  replaceRepositoryWithSafeChar,
  createSummary,
} from '../src/index.mjs';

describe('#parseRepositoryLine', function() {
  it('parse simple repository', function() {
    expect(parseRepositoryLine('https://github.com/1024pix/pix.git')).to.deep.equal({
      repository: 'https://github.com/1024pix/pix.git',
      path: ''
    })
  });

  it('parse repository with a sub directory', function() {
    expect(parseRepositoryLine('https://github.com/1024pix/pix.git#test')).to.deep.equal({
      repository: 'https://github.com/1024pix/pix.git',
      path: 'test'
    })
  });
});

describe('#cloneRepository', function() {
  it('create a temporary directory and clone the repository there', async function() {
    const simpleGit = {
      clone: sinon.stub().resolves(null)
    };
    const repositoryPath = await cloneRepository('https://github.com/1024pix/pix.git', simpleGit);
    expect(simpleGit.clone.calledWith('https://github.com/1024pix/pix.git')).to.be.true;
    expect(repositoryPath).to.be.a('string');
  });
});

describe('#replaceRepositoryWithSafeChar', function() {
  [
    {
      given: 'https://github.com/1024pix/pix.git',
      expect: 'https---github-com-1024pix-pix-git'
    },
    {
      given: 'https://github.com/1024pix/pix.git#api',
      expect: 'https---github-com-1024pix-pix-git-api'
    },
  ].forEach((line) => {
    it(`replace the repository line '${line.given}' with safe chars`, function () {
      expect(replaceRepositoryWithSafeChar(line.given)).to.equal(line.expect);
    });
  });
});

describe('#createSummary', function() {
  it('create a summary of the result', function() {
    const result = [
      {
        drift: 1,
        pulse: 2,
      },
      {
        drift: 3,
        pulse: 1,
      },
    ];
    expect(createSummary(result)).to.deep.equal({
      drift: 4,
      pulse: 3,
    });
  });
});
