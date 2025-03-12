import { expect } from 'chai';
import sinon from 'sinon';
import importData from '../importer';
import XLSX from 'xlsx';
import pool from '../db';

describe('importData', function () {
  let readFileStub, poolGetConnectionStub, connectionStub;
  let processEnvStub;

  beforeEach(function () {
    processEnvStub = sinon.stub(process.env, 'DB_TABLE').value('test_table');

    readFileStub = sinon.stub(XLSX, 'readFile').returns({
      Sheets: {
        Sheet1: {
          A1: { v: 'matricule' },
          A2: { v: '1234' },
          A3: { v: '5678' },
          B2: { v: 'John' },
          B3: { v: 'Jane' },
          C2: { v: 'Doe' },
          C3: { v: 'Smith' },
          D2: { v: '1990-01-01' },
          D3: { v: '1992-02-02' },
          E2: { v: 'active' },
          E3: { v: 'inactive' }
        }
      },
      SheetNames: ['Sheet1']
    });

    connectionStub = {
      beginTransaction: sinon.stub().resolves(),
      query: sinon.stub().resolves(),
      commit: sinon.stub().resolves(),
      rollback: sinon.stub().resolves(),
      release: sinon.stub()
    };

    poolGetConnectionStub = sinon.stub(pool, 'getConnection').resolves(connectionStub);
  });

  afterEach(function () {
    sinon.restore();
  });

  it('should import data correctly when valid file is provided', async function () {
    const filePath = 'mock/path/to/file.xlsx';
    await importData(filePath);

    expect(readFileStub.calledOnceWith(filePath)).to.be.true;
    expect(poolGetConnectionStub.calledOnce).to.be.true;
    expect(connectionStub.beginTransaction.calledOnce).to.be.true;
    expect(connectionStub.query.calledOnce).to.be.true;
    expect(connectionStub.commit.calledOnce).to.be.true;
    expect(connectionStub.release.calledOnce).to.be.true;
  });

  it('should handle empty data gracefully', async function () {
    readFileStub.returns({
      Sheets: { Sheet1: {} },
      SheetNames: ['Sheet1']
    });

    const filePath = 'mock/path/to/file.xlsx';
    await importData(filePath);

    expect(connectionStub.query.notCalled).to.be.true;
  });

  it('should rollback the transaction on error', async function () {
    connectionStub.query.rejects(new Error('Database error'));

    const filePath = 'mock/path/to/file.xlsx';
    try {
      await importData(filePath);
    } catch (error) {
      expect(connectionStub.rollback.calledOnce).to.be.true;
      expect(connectionStub.release.calledOnce).to.be.true;
    }
  });

  it('should log the import time', async function () {
    const filePath = 'mock/path/to/file.xlsx';
    const timeSpy = sinon.spy(console, 'time');
    const timeEndSpy = sinon.spy(console, 'timeEnd');

    await importData(filePath);

    expect(timeSpy.calledOnce).to.be.true;
    expect(timeEndSpy.calledOnce).to.be.true;

    timeSpy.restore();
    timeEndSpy.restore();
  });
});
