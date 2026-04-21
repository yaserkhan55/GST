import { v4 as uuidv4 } from 'uuid';
import { getGSTR2BRecordModel } from '../models/GSTR2B.model.js';
import { getPurchaseRecordModel } from '../models/PurchaseRecord.model.js';
import { getReconciliationResultModel } from '../models/ReconciliationResult.model.js';

const getMatchKey = (record) => {
  const partyGstin = record.supplierGstin || record.gstin || '';
  return `${partyGstin}::${record.invoiceNumber || ''}`;
};

const AMOUNT_TOLERANCE = 1;

export const reconcileRecords = async (purchaseUploadId, gstr2bUploadId, userId, gstin) => {
  const PurchaseRecord = getPurchaseRecordModel();
  const GSTR2BRecord = getGSTR2BRecordModel();
  const ReconciliationResult = getReconciliationResultModel();
  const startTime = Date.now();
  const reconciliationId = uuidv4();

  const result = await ReconciliationResult.create({
    reconciliationId,
    initiatedBy: userId,
    purchaseUploadId,
    gstr2bUploadId,
    gstin,
    status: 'processing'
  });

  try {
    const purchaseRecords = await PurchaseRecord.find({ uploadId: purchaseUploadId });
    const gstr2bRecords = await GSTR2BRecord.find({ uploadId: gstr2bUploadId });
    const gstr2bMap = new Map();

    for (const rec of gstr2bRecords) {
      const key = getMatchKey(rec);
      gstr2bMap.set(key, rec);
    }

    const matchedRecords = [];
    const unmatchedRecords = [];

    for (const purchase of purchaseRecords) {
      const key = getMatchKey(purchase);
      const gstr2bMatch = gstr2bMap.get(key);

      if (!gstr2bMatch) {
        unmatchedRecords.push({
          purchaseRecord: purchase._id,
          gstr2bRecord: null,
          invoiceNumber: purchase.invoiceNumber,
          gstin: purchase.gstin,
          reason: 'missing_in_gstr2b',
          purchaseAmount: purchase.totalAmount,
          gstr2bAmount: null,
          purchaseTaxDetails: {
            igst: purchase.igst || 0,
            cgst: purchase.cgst || 0,
            sgst: purchase.sgst || 0,
            cess: purchase.cess || 0
          },
          gstr2bTaxDetails: null,
          difference: purchase.totalAmount,
          details: `Invoice ${purchase.invoiceNumber} not found in GSTR2B data`
        });
      } else {
        const amountDiff = Math.abs(purchase.totalAmount - gstr2bMatch.totalAmount);
        const taxDiff =
          Math.abs(purchase.igst - gstr2bMatch.igst) +
          Math.abs(purchase.cgst - gstr2bMatch.cgst) +
          Math.abs(purchase.sgst - gstr2bMatch.sgst);

        if (amountDiff <= AMOUNT_TOLERANCE && taxDiff <= AMOUNT_TOLERANCE) {
          matchedRecords.push({
            purchaseRecord: purchase._id,
            gstr2bRecord: gstr2bMatch._id,
            invoiceNumber: purchase.invoiceNumber,
            gstin: purchase.gstin,
            purchaseAmount: purchase.totalAmount,
            gstr2bAmount: gstr2bMatch.totalAmount,
            purchaseTaxDetails: {
              igst: purchase.igst || 0,
              cgst: purchase.cgst || 0,
              sgst: purchase.sgst || 0,
              cess: purchase.cess || 0
            },
            gstr2bTaxDetails: {
              igst: gstr2bMatch.igst || 0,
              cgst: gstr2bMatch.cgst || 0,
              sgst: gstr2bMatch.sgst || 0,
              cess: gstr2bMatch.cess || 0
            }
          });

          await PurchaseRecord.findByIdAndUpdate(purchase._id, { status: 'processed' });
        } else if (amountDiff > AMOUNT_TOLERANCE) {
          unmatchedRecords.push({
            purchaseRecord: purchase._id,
            gstr2bRecord: gstr2bMatch._id,
            invoiceNumber: purchase.invoiceNumber,
            gstin: purchase.gstin,
            reason: 'amount_mismatch',
            purchaseAmount: purchase.totalAmount,
            gstr2bAmount: gstr2bMatch.totalAmount,
            purchaseTaxDetails: {
              igst: purchase.igst || 0,
              cgst: purchase.cgst || 0,
              sgst: purchase.sgst || 0,
              cess: purchase.cess || 0
            },
            gstr2bTaxDetails: {
              igst: gstr2bMatch.igst || 0,
              cgst: gstr2bMatch.cgst || 0,
              sgst: gstr2bMatch.sgst || 0,
              cess: gstr2bMatch.cess || 0
            },
            difference: amountDiff,
            details: `Invoice amount mismatch. Purchase: Rs ${purchase.totalAmount.toFixed(2)}, GSTR2B: Rs ${gstr2bMatch.totalAmount.toFixed(2)}, Diff: Rs ${amountDiff.toFixed(2)}`
          });
        } else {
          unmatchedRecords.push({
            purchaseRecord: purchase._id,
            gstr2bRecord: gstr2bMatch._id,
            invoiceNumber: purchase.invoiceNumber,
            gstin: purchase.gstin,
            reason: 'tax_mismatch',
            purchaseAmount: purchase.totalAmount,
            gstr2bAmount: gstr2bMatch.totalAmount,
            purchaseTaxDetails: {
              igst: purchase.igst || 0,
              cgst: purchase.cgst || 0,
              sgst: purchase.sgst || 0,
              cess: purchase.cess || 0
            },
            gstr2bTaxDetails: {
              igst: gstr2bMatch.igst || 0,
              cgst: gstr2bMatch.cgst || 0,
              sgst: gstr2bMatch.sgst || 0,
              cess: gstr2bMatch.cess || 0
            },
            difference: taxDiff,
            details: `Tax amount mismatch. Total tax diff: Rs ${taxDiff.toFixed(2)}`
          });
        }

        gstr2bMap.delete(key);
      }
    }

    for (const [, gstr2bRec] of gstr2bMap) {
      unmatchedRecords.push({
        purchaseRecord: null,
        gstr2bRecord: gstr2bRec._id,
        invoiceNumber: gstr2bRec.invoiceNumber,
        gstin: gstr2bRec.gstin,
        reason: 'missing_in_purchase',
        purchaseAmount: null,
        gstr2bAmount: gstr2bRec.totalAmount,
        purchaseTaxDetails: null,
        gstr2bTaxDetails: {
          igst: gstr2bRec.igst || 0,
          cgst: gstr2bRec.cgst || 0,
          sgst: gstr2bRec.sgst || 0,
          cess: gstr2bRec.cess || 0
        },
        difference: gstr2bRec.totalAmount,
        details: `Invoice ${gstr2bRec.invoiceNumber} exists in GSTR2B but not in Purchase records`
      });
    }

    const totalPurchase = purchaseRecords.length;
    const totalGSTR2B = gstr2bRecords.length;
    const matchedCount = matchedRecords.length;
    const unmatchedCount = unmatchedRecords.length;
    const matchPercentage = totalPurchase > 0 ? ((matchedCount / totalPurchase) * 100).toFixed(2) : 0;

    await ReconciliationResult.findByIdAndUpdate(result._id, {
      status: 'completed',
      summary: {
        totalPurchaseRecords: totalPurchase,
        totalGSTR2BRecords: totalGSTR2B,
        matchedCount,
        unmatchedCount,
        missingInGSTR2B: unmatchedRecords.filter(r => r.reason === 'missing_in_gstr2b').length,
        amountMismatch: unmatchedRecords.filter(r => r.reason === 'amount_mismatch').length,
        matchPercentage: parseFloat(matchPercentage)
      },
      matchedRecords,
      unmatchedRecords,
      processingTime: Date.now() - startTime
    });

    return { reconciliationId, status: 'completed', matchedCount, unmatchedCount };
  } catch (error) {
    await ReconciliationResult.findByIdAndUpdate(result._id, {
      status: 'failed',
      errorMessage: error.message
    });
    throw error;
  }
};
