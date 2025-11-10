import React, { useState, useEffect, useRef } from 'react';
import { useLoadScript } from '@react-google-maps/api';
import { db, auth } from '../firebase';
import { doc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { SECTIONS } from './surveyConstants';
import Section1Formation from './Section1Formation';
import Section2Cofounders from './Section2Cofounders';
import Section3EquityAllocation from './Section3EquityAllocation';
import Section4DecisionMaking from './Section4DecisionMaking';
import Section5EquityVesting from './Section5EquityVesting';
import Section6IP from './Section6IP';
import Section7Compensation from './Section7Compensation';
import Section8Performance from './Section8Performance';
import Section9NonCompete from './Section9NonCompete';
import Section10Final from './Section10Final';
import CollaboratorManager from './CollaboratorManager';

const libraries = ['places'];

function Survey({ projectId, allProjects = [], onProjectSwitch, onPreview, onCreateProject }) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });
  const [project, setProject] = useState(null);
  const [currentSection, setCurrentSection] = useState(1);
  const [formData, setFormData] = useState({
    // Section 1: Formation & Purpose
    companyName: '',
    entityType: '',
    entityTypeOther: '',
    registeredState: '',
    mailingStreet: '',
    mailingStreet2: '',
    mailingCity: '',
    mailingState: '',
    mailingZip: '',
    fullMailingAddress: '',
    companyDescription: '',
    industries: [],
    industryOther: '',

    // Section 2: Cofounder Info
    cofounderCount: '',
    cofounders: [],

    // Section 3: Equity Allocation
    finalEquityPercentages: {},
    acknowledgeEquityAllocation: {},
    equityCalculatorDraft: {}, // Individual private drafts per user
    equityCalculatorSubmitted: {}, // Public submitted versions per user

    // Section 4: Decision-Making & Voting
    majorDecisions: [],
    majorDecisionsOther: '',
    equityVotingPower: '',
    finalSayPerson: '',
    tieResolution: '',
    tieResolutionOther: '',
    acknowledgeTieResolution: {},
    includeShotgunClause: '',
    acknowledgeShotgunClause: {},

    // Section 5: Equity & Vesting
    vestingStartDate: '',
    vestingSchedule: '',
    vestingScheduleOther: '',
    cliffPercentage: '',
    accelerationTrigger: '',
    sharesSellNoticeDays: '',
    sharesBuybackDays: '',
    acknowledgeForfeiture: false,
    vestedSharesDisposal: '',

    // Section 6: IP & Ownership
    hasPreExistingIP: '',
    acknowledgeIPAssignment: false,
    acknowledgeIPOwnership: false,

    // Section 7: Compensation & Expenses
    takingCompensation: '',
    compensations: [],
    spendingLimit: '',

    // Section 8: Performance (Cofounder Performance & Departure)
    performanceConsequences: [],
    remedyPeriodDays: '',
    terminationWithCause: [],
    terminationWithCauseOther: '',
    voluntaryNoticeDays: '',

    // Section 9: Non-Competition (Confidentiality, Non-Competition & Non-Solicitation)
    acknowledgeConfidentiality: false,
    nonCompeteDuration: '',
    nonCompeteDurationOther: '',
    nonSolicitDuration: '',
    nonSolicitDurationOther: '',

    // Section 10: Final Details
    disputeResolution: '',
    disputeResolutionOther: '',
    governingLaw: '',
    amendmentProcess: '',
    amendmentProcessOther: '',
    reviewFrequencyMonths: '',
    acknowledgePeriodicReview: {},
    acknowledgeAmendmentReviewRequest: {},
    acknowledgeEntireAgreement: {},
    acknowledgeSeverability: {}
  });

  const [saveStatus, setSaveStatus] = useState('saved');
  const [lastSaved, setLastSaved] = useState(null);
  const saveTimeoutRef = useRef(null);
  const isSavingRef = useRef(false);
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [isEditingProjectName, setIsEditingProjectName] = useState(false);
  const [editedProjectName, setEditedProjectName] = useState('');

  // Helper function to calculate fullMailingAddress
  const calculateFullMailingAddress = (addressData) => {
    const { mailingStreet, mailingStreet2, mailingCity, mailingState, mailingZip } = addressData;

    let fullAddress = '';
    if (mailingStreet) {
      fullAddress = mailingStreet;
      if (mailingStreet2) {
        fullAddress += '\n' + mailingStreet2;
      }
      if (mailingCity || mailingState || mailingZip) {
        fullAddress += '\n' + [mailingCity, mailingState, mailingZip].filter(Boolean).join(', ');
      }
    }
    return fullAddress;
  };

  // Reset to section 1 when project changes
  useEffect(() => {
    setCurrentSection(1);
  }, [projectId]);

  // Listen to project changes
  useEffect(() => {
    const projectRef = doc(db, 'projects', projectId);

    const unsubscribe = onSnapshot(projectRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setProject(data);

        if (!isSavingRef.current) {
          // Create initial blank form data
          const initialFormData = {
            // Section 1: Formation & Purpose
            companyName: '',
            entityType: '',
            entityTypeOther: '',
            registeredState: '',
            mailingStreet: '',
            mailingStreet2: '',
            mailingCity: '',
            mailingState: '',
            mailingZip: '',
            fullMailingAddress: '',
            companyDescription: '',
            industries: [],
            industryOther: '',

            // Section 2: Cofounder Info
            cofounderCount: '',
            cofounders: [],

            // Section 3: Equity Allocation
            finalEquityPercentages: {},
            acknowledgeEquityAllocation: {},
            equityCalculatorDraft: {},
            equityCalculatorSubmitted: {},

            // Section 4: Decision-Making & Voting
            majorDecisions: [],
            majorDecisionsOther: '',
            equityVotingPower: '',
            finalSayPerson: '',
            tieResolution: '',
            tieResolutionOther: '',
            acknowledgeTieResolution: {},
            includeShotgunClause: '',
            acknowledgeShotgunClause: {},

            // Section 5: Equity & Vesting
            vestingStartDate: '',
            vestingSchedule: '',
            vestingScheduleOther: '',
            cliffPercentage: '',
            accelerationTrigger: '',
            sharesSellNoticeDays: '',
            sharesBuybackDays: '',
            acknowledgeForfeiture: false,
            vestedSharesDisposal: '',

            // Section 6: IP & Ownership
            hasPreExistingIP: '',
            acknowledgeIPAssignment: false,
            acknowledgeIPOwnership: false,

            // Section 7: Compensation & Expenses
            takingCompensation: '',
            compensations: [],
            spendingLimit: '',

            // Section 8: Performance
            performanceConsequences: [],
            remedyPeriodDays: '',
            terminationWithCause: [],
            terminationWithCauseOther: '',
            voluntaryNoticeDays: '',

            // Section 9: Non-Competition
            acknowledgeConfidentiality: false,
            nonCompeteDuration: '',
            nonCompeteDurationOther: '',
            nonSolicitDuration: '',
            nonSolicitDurationOther: '',

            // Section 10: Final Details
            disputeResolution: '',
            disputeResolutionOther: '',
            governingLaw: '',
            amendmentProcess: '',
            amendmentProcessOther: '',
            reviewFrequencyMonths: '',
            acknowledgePeriodicReview: {},
            acknowledgeAmendmentReviewRequest: {},
            acknowledgeEntireAgreement: {},
            acknowledgeSeverability: {}
          };

          const loadedData = {
            ...initialFormData,
            ...(data.surveyData || {})
          };

          // Calculate fullMailingAddress if it doesn't exist (backwards compatibility)
          if (!loadedData.fullMailingAddress && loadedData.mailingStreet) {
            loadedData.fullMailingAddress = calculateFullMailingAddress(loadedData);
          }

          setFormData(loadedData);
        }

        // Set lastSaved from updatedAt if available
        if (data.updatedAt && !lastSaved) {
          setLastSaved(data.updatedAt.toDate());
        }
      }
    });

    return unsubscribe;
  }, [projectId]);


  // Auto-save function
  const saveFormData = async (dataToSave) => {
    if (!project) return;

    isSavingRef.current = true;
    setSaveStatus('saving');

    try {
      const projectRef = doc(db, 'projects', projectId);

      // Clean and merge "Other" fields before saving
      const cleanedData = { ...dataToSave };

      // Merge "Other" array fields
      if (cleanedData.industries?.includes('Other') && cleanedData.industryOther) {
        cleanedData.industries = cleanedData.industries.map(item =>
          item === 'Other' ? cleanedData.industryOther : item
        );
      }
      if (cleanedData.majorDecisions?.includes('Other') && cleanedData.majorDecisionsOther) {
        cleanedData.majorDecisions = cleanedData.majorDecisions.map(item =>
          item === 'Other' ? cleanedData.majorDecisionsOther : item
        );
      }
      if (cleanedData.terminationWithCause?.includes('Other') && cleanedData.terminationWithCauseOther) {
        cleanedData.terminationWithCause = cleanedData.terminationWithCause.map(item =>
          item === 'Other' ? cleanedData.terminationWithCauseOther : item
        );
      }

      // Merge "Other" string fields
      if (cleanedData.entityType === 'Other' && cleanedData.entityTypeOther) {
        cleanedData.entityType = cleanedData.entityTypeOther;
      }
      if (cleanedData.tieResolution === 'Other' && cleanedData.tieResolutionOther) {
        cleanedData.tieResolution = cleanedData.tieResolutionOther;
      }
      if (cleanedData.vestingSchedule === 'Other' && cleanedData.vestingScheduleOther) {
        cleanedData.vestingSchedule = cleanedData.vestingScheduleOther;
      }
      if (cleanedData.nonCompeteDuration === 'Other' && cleanedData.nonCompeteDurationOther) {
        cleanedData.nonCompeteDuration = cleanedData.nonCompeteDurationOther;
      }
      if (cleanedData.nonSolicitDuration === 'Other' && cleanedData.nonSolicitDurationOther) {
        cleanedData.nonSolicitDuration = cleanedData.nonSolicitDurationOther;
      }
      if (cleanedData.disputeResolution === 'Other' && cleanedData.disputeResolutionOther) {
        cleanedData.disputeResolution = cleanedData.disputeResolutionOther;
      }
      if (cleanedData.amendmentProcess === 'Other' && cleanedData.amendmentProcessOther) {
        cleanedData.amendmentProcess = cleanedData.amendmentProcessOther;
      }

      // Remove all "*Other" fields after merging
      const otherFields = [
        'entityTypeOther', 'industryOther', 'majorDecisionsOther', 'tieResolutionOther', 'vestingScheduleOther',
        'nonCompeteDurationOther', 'nonSolicitDurationOther', 'terminationWithCauseOther',
        'disputeResolutionOther', 'amendmentProcessOther'
      ];
      otherFields.forEach(field => delete cleanedData[field]);

      // Check if there are actual changes
      const oldData = project.surveyData || {};
      const changedFields = Object.keys(cleanedData).filter(key => {
        return JSON.stringify(oldData[key]) !== JSON.stringify(cleanedData[key]);
      });

      const updateData = {
        surveyData: cleanedData,
        lastUpdated: serverTimestamp(),
        lastEditedBy: auth.currentUser.email
      };

      // Reset approvals only if there are actual changes
      if (changedFields.length > 0 && project.requiresApprovals) {
        updateData.approvals = {};
      }

      await updateDoc(projectRef, updateData);

      setSaveStatus('saved');
      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving:', error);
      setSaveStatus('error');
    } finally {
      setTimeout(() => {
        isSavingRef.current = false;
      }, 500);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prevFormData => {
      const newFormData = {
        ...prevFormData,
        [field]: value
      };

      // Auto-update fullMailingAddress when any address field changes
      const addressFields = ['mailingStreet', 'mailingStreet2', 'mailingCity', 'mailingState', 'mailingZip'];
      if (addressFields.includes(field)) {
        newFormData.fullMailingAddress = calculateFullMailingAddress(newFormData);
      }

      setSaveStatus('saving');

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        saveFormData(newFormData);
      }, 2000);

      return newFormData;
    });
  };

  // Helper function to check if a field with "Other" option is properly filled
  const isOtherFieldValid = (value, otherValue) => {
    if (value === 'Other') {
      return otherValue && otherValue.trim() !== '';
    }
    return !!value;
  };

  // Helper function to check if an array field with "Other" option is properly filled
  const isOtherArrayFieldValid = (array, otherValue) => {
    if (!array || array.length === 0) return false;
    if (array.includes('Other')) {
      return otherValue && otherValue.trim() !== '';
    }
    return true;
  };

  // Calculate progress across all sections
  const calculateProgress = () => {
    let totalRequired = 0;
    let completed = 0;

    // Get all collaborators
    const allCollaborators = [...new Set([project?.ownerEmail, ...(project?.collaborators || [])])].filter(Boolean);

    // Section 1: Formation & Purpose
    if (formData.companyName) completed++;
    totalRequired++;
    if (isOtherFieldValid(formData.entityType, formData.entityTypeOther)) completed++;
    totalRequired++;
    if (formData.registeredState) completed++;
    totalRequired++;
    if (formData.mailingStreet) completed++;
    totalRequired++;
    if (formData.mailingCity) completed++;
    totalRequired++;
    if (formData.mailingState) completed++;
    totalRequired++;
    if (formData.mailingZip) completed++;
    totalRequired++;
    if (formData.companyDescription) completed++;
    totalRequired++;
    if (isOtherArrayFieldValid(formData.industries, formData.industryOther)) completed++;
    totalRequired++;

    // Section 2: Cofounder Info
    if (formData.cofounderCount) completed++;
    totalRequired++;
    // Check if all cofounders have required fields
    if (formData.cofounders && formData.cofounders.length > 0) {
      const allCofoundersFilled = formData.cofounders.every(cf =>
        cf.fullName && cf.title && cf.email && cf.roles && cf.roles.length > 0
      );
      if (allCofoundersFilled) completed++;
      totalRequired++;
    }

    // Section 3: Equity Allocation
    if (formData.finalEquityPercentages && Object.keys(formData.finalEquityPercentages).length > 0) {
      const allPercentagesFilled = allCollaborators.every(email =>
        formData.finalEquityPercentages[email] && formData.finalEquityPercentages[email] !== ''
      );
      if (allPercentagesFilled) completed++;
      totalRequired++;

      const totalEquity = allCollaborators.reduce((sum, email) =>
        sum + (parseFloat(formData.finalEquityPercentages[email]) || 0), 0
      );
      if (Math.abs(totalEquity - 100) <= 0.01) completed++;
      totalRequired++;
    }
    const allAcknowledgedEquityAllocation = allCollaborators.length > 0 &&
      allCollaborators.every(email => formData.acknowledgeEquityAllocation?.[email]);
    if (allAcknowledgedEquityAllocation) completed++;
    totalRequired++;

    // Section 4: Decision-Making
    if (isOtherArrayFieldValid(formData.majorDecisions, formData.majorDecisionsOther)) completed++;
    totalRequired++;
    if (formData.equityVotingPower) completed++;
    totalRequired++;
    if (formData.finalSayPerson) completed++;
    totalRequired++;
    if (isOtherFieldValid(formData.tieResolution, formData.tieResolutionOther)) completed++;
    totalRequired++;
    // Check if all collaborators have acknowledged tie resolution
    const allAcknowledgedTieResolution = allCollaborators.length > 0 &&
      allCollaborators.every(email => formData.acknowledgeTieResolution?.[email]);
    if (allAcknowledgedTieResolution) completed++;
    totalRequired++;
    if (formData.includeShotgunClause) completed++;
    totalRequired++;
    if (formData.includeShotgunClause === 'Yes') {
      const allAcknowledgedShotgunClause = allCollaborators.length > 0 &&
        allCollaborators.every(email => formData.acknowledgeShotgunClause?.[email]);
      if (allAcknowledgedShotgunClause) completed++;
      totalRequired++;
    }

    // Section 5: Equity & Vesting
    if (formData.vestingStartDate) completed++;
    totalRequired++;
    if (isOtherFieldValid(formData.vestingSchedule, formData.vestingScheduleOther)) completed++;
    totalRequired++;
    if (formData.cliffPercentage) completed++;
    totalRequired++;
    if (formData.accelerationTrigger) completed++;
    totalRequired++;
    if (formData.sharesSellNoticeDays) completed++;
    totalRequired++;
    if (formData.sharesBuybackDays) completed++;
    totalRequired++;
    // Check if all collaborators have acknowledged forfeiture
    const allAcknowledgedForfeiture = allCollaborators.length > 0 &&
      allCollaborators.every(email => formData.acknowledgeForfeiture?.[email]);
    if (allAcknowledgedForfeiture) completed++;
    totalRequired++;
    if (formData.vestedSharesDisposal) completed++;
    totalRequired++;

    // Section 6: IP & Ownership
    if (formData.hasPreExistingIP) completed++;
    totalRequired++;
    // Check if all collaborators have acknowledged IP ownership
    const allAcknowledgedIPOwnership = allCollaborators.length > 0 &&
      allCollaborators.every(email => formData.acknowledgeIPOwnership?.[email]);
    if (allAcknowledgedIPOwnership) completed++;
    totalRequired++;

    // Section 7: Compensation
    if (formData.takingCompensation) completed++;
    totalRequired++;
    if (formData.spendingLimit) completed++;
    totalRequired++;

    // Section 8: Performance (Cofounder Performance & Departure)
    if (formData.performanceConsequences && formData.performanceConsequences.length > 0) completed++;
    totalRequired++;
    if (formData.remedyPeriodDays) completed++;
    totalRequired++;
    if (isOtherArrayFieldValid(formData.terminationWithCause, formData.terminationWithCauseOther)) completed++;
    totalRequired++;
    if (formData.voluntaryNoticeDays) completed++;
    totalRequired++;

    // Section 9: Non-Competition (Confidentiality, Non-Competition & Non-Solicitation)
    // Check if all collaborators have acknowledged confidentiality
    const allAcknowledgedConfidentiality = allCollaborators.length > 0 &&
      allCollaborators.every(email => formData.acknowledgeConfidentiality?.[email]);
    if (allAcknowledgedConfidentiality) completed++;
    totalRequired++;
    if (isOtherFieldValid(formData.nonCompeteDuration, formData.nonCompeteDurationOther)) completed++;
    totalRequired++;
    if (isOtherFieldValid(formData.nonSolicitDuration, formData.nonSolicitDurationOther)) completed++;
    totalRequired++;

    // Section 10: Final Details
    if (isOtherFieldValid(formData.disputeResolution, formData.disputeResolutionOther)) completed++;
    totalRequired++;
    if (formData.governingLaw) completed++;
    totalRequired++;
    if (isOtherFieldValid(formData.amendmentProcess, formData.amendmentProcessOther)) completed++;
    totalRequired++;
    if (formData.reviewFrequencyMonths) completed++;
    totalRequired++;
    // Check if all collaborators have acknowledged periodic review
    const allAcknowledgedPeriodicReview = allCollaborators.length > 0 &&
      allCollaborators.every(email => formData.acknowledgePeriodicReview?.[email]);
    if (allAcknowledgedPeriodicReview) completed++;
    totalRequired++;
    // Check if all collaborators have acknowledged amendment review request
    const allAcknowledgedAmendmentReviewRequest = allCollaborators.length > 0 &&
      allCollaborators.every(email => formData.acknowledgeAmendmentReviewRequest?.[email]);
    if (allAcknowledgedAmendmentReviewRequest) completed++;
    totalRequired++;
    // Check if all collaborators have acknowledged entire agreement
    const allAcknowledgedEntireAgreement = allCollaborators.length > 0 &&
      allCollaborators.every(email => formData.acknowledgeEntireAgreement?.[email]);
    if (allAcknowledgedEntireAgreement) completed++;
    totalRequired++;
    // Check if all collaborators have acknowledged severability
    const allAcknowledgedSeverability = allCollaborators.length > 0 &&
      allCollaborators.every(email => formData.acknowledgeSeverability?.[email]);
    if (allAcknowledgedSeverability) completed++;
    totalRequired++;

    return Math.round((completed / totalRequired) * 100);
  };

  // Check if a specific section is completed
  const isSectionCompleted = (sectionId) => {
    const allCollaborators = [...new Set([project?.ownerEmail, ...(project?.collaborators || [])])].filter(Boolean);

    switch(sectionId) {
      case 1: // Formation & Purpose
        return formData.companyName &&
               isOtherFieldValid(formData.entityType, formData.entityTypeOther) &&
               formData.registeredState &&
               formData.mailingStreet && formData.mailingCity && formData.mailingState &&
               formData.mailingZip && formData.companyDescription &&
               isOtherArrayFieldValid(formData.industries, formData.industryOther);

      case 2: // Cofounder Info
        if (!formData.cofounderCount) return false;
        if (formData.cofounders && formData.cofounders.length > 0) {
          // Check that all cofounders have all required fields filled
          const allCofoundersFilled = formData.cofounders.every(cf =>
            cf.fullName && cf.title && cf.email &&
            cf.roles && cf.roles.length > 0
          );
          return allCofoundersFilled;
        }
        return true;

      case 3: // Equity Allocation
        // Check that all equity percentages are filled
        const allPercentagesFilled = allCollaborators.every(email =>
          formData.finalEquityPercentages?.[email] && formData.finalEquityPercentages[email] !== ''
        );
        if (!allPercentagesFilled) return false;

        // Check that total equity equals 100%
        const totalEquity = allCollaborators.reduce((sum, email) =>
          sum + (parseFloat(formData.finalEquityPercentages?.[email]) || 0), 0
        );
        if (Math.abs(totalEquity - 100) > 0.01) return false;

        // Check that all collaborators have acknowledged
        const allAcknowledgedEquityAllocation = allCollaborators.length > 0 &&
          allCollaborators.every(email => formData.acknowledgeEquityAllocation?.[email]);
        return allAcknowledgedEquityAllocation;

      case 4: // Vesting Schedule
        const allAcknowledgedForfeiture = allCollaborators.length > 0 &&
          allCollaborators.every(email => formData.acknowledgeForfeiture?.[email]);
        return formData.vestingStartDate &&
               isOtherFieldValid(formData.vestingSchedule, formData.vestingScheduleOther) &&
               formData.cliffPercentage && formData.accelerationTrigger &&
               formData.sharesSellNoticeDays && formData.sharesBuybackDays &&
               allAcknowledgedForfeiture && formData.vestedSharesDisposal;

      case 5: // Decision-Making
        const allAcknowledgedTieResolution = allCollaborators.length > 0 &&
          allCollaborators.every(email => formData.acknowledgeTieResolution?.[email]);
        const allAcknowledgedShotgunClause = formData.includeShotgunClause === 'Yes' ? (
          allCollaborators.length > 0 &&
          allCollaborators.every(email => formData.acknowledgeShotgunClause?.[email])
        ) : true;
        return isOtherArrayFieldValid(formData.majorDecisions, formData.majorDecisionsOther) &&
               formData.equityVotingPower && formData.finalSayPerson &&
               isOtherFieldValid(formData.tieResolution, formData.tieResolutionOther) &&
               allAcknowledgedTieResolution &&
               formData.includeShotgunClause && allAcknowledgedShotgunClause;

      case 6: // IP & Ownership
        const allAcknowledgedIPOwnership = allCollaborators.length > 0 &&
          allCollaborators.every(email => formData.acknowledgeIPOwnership?.[email]);
        return formData.hasPreExistingIP && allAcknowledgedIPOwnership;

      case 7: // Compensation
        return formData.takingCompensation && formData.spendingLimit;

      case 8: // Performance (Cofounder Performance & Departure)
        return formData.performanceConsequences && formData.performanceConsequences.length > 0 &&
               formData.remedyPeriodDays &&
               isOtherArrayFieldValid(formData.terminationWithCause, formData.terminationWithCauseOther) &&
               formData.voluntaryNoticeDays;

      case 9: // Non-Competition (Confidentiality, Non-Competition & Non-Solicitation)
        const allAcknowledgedConfidentiality = allCollaborators.length > 0 &&
          allCollaborators.every(email => formData.acknowledgeConfidentiality?.[email]);
        return allAcknowledgedConfidentiality &&
               isOtherFieldValid(formData.nonCompeteDuration, formData.nonCompeteDurationOther) &&
               isOtherFieldValid(formData.nonSolicitDuration, formData.nonSolicitDurationOther);

      case 10: // Final Details
        const allAcknowledgedPeriodicReview = allCollaborators.length > 0 &&
          allCollaborators.every(email => formData.acknowledgePeriodicReview?.[email]);
        const allAcknowledgedAmendmentReviewRequest = allCollaborators.length > 0 &&
          allCollaborators.every(email => formData.acknowledgeAmendmentReviewRequest?.[email]);
        const allAcknowledgedEntireAgreement = allCollaborators.length > 0 &&
          allCollaborators.every(email => formData.acknowledgeEntireAgreement?.[email]);
        const allAcknowledgedSeverability = allCollaborators.length > 0 &&
          allCollaborators.every(email => formData.acknowledgeSeverability?.[email]);
        return isOtherFieldValid(formData.disputeResolution, formData.disputeResolutionOther) &&
               formData.governingLaw &&
               isOtherFieldValid(formData.amendmentProcess, formData.amendmentProcessOther) &&
               formData.reviewFrequencyMonths &&
               allAcknowledgedPeriodicReview && allAcknowledgedAmendmentReviewRequest &&
               allAcknowledgedEntireAgreement && allAcknowledgedSeverability;

      default:
        return false;
    }
  };

  const isReadOnly = project?.submitted;

  // Find first incomplete section
  const findFirstIncompleteSection = () => {
    for (let sectionId = 1; sectionId <= 10; sectionId++) {
      if (!isSectionCompleted(sectionId)) {
        return sectionId;
      }
    }
    return null;
  };

  // Handle preview/submit click
  const handlePreviewClick = async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      await saveFormData(formData);
    }
    if (saveStatus === 'saving') {
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Check if all sections are complete
    const firstIncompleteSection = findFirstIncompleteSection();
    if (firstIncompleteSection) {
      setShowValidation(true);
      // Simulate clicking the section button
      const sectionButton = document.querySelector(`[data-section-id="${firstIncompleteSection}"]`);
      if (sectionButton) {
        sectionButton.click();
      }

      // After section loads, scroll to first validation error
      setTimeout(() => {
        const firstError = document.querySelector('.text-red-700, .validation-error');
        if (firstError) {
          // Find the closest parent question container
          const questionContainer = firstError.closest('div');
          if (questionContainer) {
            questionContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, 100);
    } else {
      onPreview();
    }
  };

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#ffffff' }}>
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#ffffff' }}>
      {/* Sidebar Navigation */}
      <div className="border-r border-gray-200 flex flex-col fixed h-screen" style={{ backgroundColor: '#FFFFFF', width: '270px' }}>
        {/* Header */}
        <div className="p-3 border-b border-gray-200">
          {/* Cherrytree Logo */}
          <div className="flex items-center mb-3">
            <svg width="24" height="24" viewBox="22 22 56 56" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
              <path d="M70.63,61.53c-.77-5.18-5.27-6.64-10.45-5.86l-.39.06C57.39,47.09,53,42.27,49.53,39.66c3.65.71,6.83.23,9.74-3.08,1.9-2.18,2.83-5.14,5.75-7.53a.46.46,0,0,0-.17-.8c-5.07-1.4-11.84-1.08-15.43,3a13.83,13.83,0,0,0-3.17,6.38,18.48,18.48,0,0,0-4.87-1.73.35.35,0,0,0-.41.3l-.23,1.62a.35.35,0,0,0,.28.4A17.86,17.86,0,0,1,45.74,40c2.49,6.14-2.9,13.55-5.88,17-4.7-1.25-9-.37-10.28,4.33a8.89,8.89,0,1,0,17.15,4.67c1.16-4.26-1.42-7.08-5.4-8.54A37.59,37.59,0,0,0,45,52.51c2.59-4.14,3.57-8,2.91-11.25l.42.3A25.14,25.14,0,0,1,58.47,56c-4.28,1.08-7.25,3.73-6.57,8.31a9.47,9.47,0,1,0,18.73-2.79Z" fill="black" shapeRendering="geometricPrecision"/>
            </svg>
          </div>

          {isEditingProjectName ? (
            <input
              type="text"
              value={editedProjectName}
              onChange={(e) => setEditedProjectName(e.target.value)}
              onBlur={async () => {
                if (editedProjectName.trim() && editedProjectName !== project?.name) {
                  try {
                    const projectRef = doc(db, 'projects', projectId);
                    await updateDoc(projectRef, { name: editedProjectName.trim() });
                  } catch (error) {
                    console.error('Error updating project name:', error);
                  }
                }
                setIsEditingProjectName(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.target.blur();
                }
                if (e.key === 'Escape') {
                  setIsEditingProjectName(false);
                }
              }}
              autoFocus
              className="text-lg font-semibold text-gray-900 mb-3 w-full border-b border-blue-500 focus:outline-none bg-transparent"
            />
          ) : (
            <h2
              className="text-lg font-semibold text-gray-900 mb-3 cursor-pointer hover:text-gray-700 transition-colors"
              onClick={() => {
                setEditedProjectName(project?.name || '');
                setIsEditingProjectName(true);
              }}
              title="Click to edit project name"
            >
              {project?.name || 'Loading...'}
            </h2>
          )}

          {/* Collaborators Button */}
          <button
            onClick={() => setShowCollaborators(true)}
            className="w-full bg-gray-200 text-gray-900 px-4 py-2.5 rounded font-medium hover:bg-gray-300 transition text-sm"
          >
            Add Collaborators
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-3 py-2.5 border-b border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-gray-600">Progress</span>
            <span className="text-xs font-medium text-black font-bold">{calculateProgress()}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-black h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${calculateProgress()}%` }}
            />
          </div>
          <div className="mt-2">
            {saveStatus === 'saving' && (
              <span className="text-xs text-gray-500">Saving...</span>
            )}
            {saveStatus === 'saved' && lastSaved && (
              <span className="text-xs text-gray-500">
                Saved at {lastSaved.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-xs text-red-600">Error saving</span>
            )}
          </div>
        </div>

        {/* Section Navigation */}
        <div className="flex-1 overflow-y-auto pt-4 pb-2 px-2">
          {SECTIONS.map((section) => {
            const isCompleted = isSectionCompleted(section.id);
            return (
              <button
                key={section.id}
                data-section-id={section.id}
                onClick={() => setCurrentSection(section.id)}
                className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition-all duration-200 flex items-center justify-between hover:scale-105 ${
                  currentSection === section.id
                    ? 'bg-gray-100 text-black font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <span className={`flex items-center justify-center w-6 h-6 font-semibold mr-3 ${
                    currentSection === section.id
                      ? 'text-black text-sm'
                      : isCompleted
                        ? ''
                        : 'text-gray-600 text-sm'
                  }`}>
                    {isCompleted ? (
                      <svg width="16" height="16" viewBox="22 22 56 56" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
                        <path d="M70.63,61.53c-.77-5.18-5.27-6.64-10.45-5.86l-.39.06C57.39,47.09,53,42.27,49.53,39.66c3.65.71,6.83.23,9.74-3.08,1.9-2.18,2.83-5.14,5.75-7.53a.46.46,0,0,0-.17-.8c-5.07-1.4-11.84-1.08-15.43,3a13.83,13.83,0,0,0-3.17,6.38,18.48,18.48,0,0,0-4.87-1.73.35.35,0,0,0-.41.3l-.23,1.62a.35.35,0,0,0,.28.4A17.86,17.86,0,0,1,45.74,40c2.49,6.14-2.9,13.55-5.88,17-4.7-1.25-9-.37-10.28,4.33a8.89,8.89,0,1,0,17.15,4.67c1.16-4.26-1.42-7.08-5.4-8.54A37.59,37.59,0,0,0,45,52.51c2.59-4.14,3.57-8,2.91-11.25l.42.3A25.14,25.14,0,0,1,58.47,56c-4.28,1.08-7.25,3.73-6.57,8.31a9.47,9.47,0,1,0,18.73-2.79Z" fill="black" shape-rendering="geometricPrecision"/>
                      </svg>
                    ) : (
                      section.id
                    )}
                  </span>
                  {section.name}
                </div>
              </button>
            );
          })}
        </div>

        {/* Projects Button - Bottom of Sidebar */}
        <div className="p-3 border-t border-gray-200 relative">
          {/* Project Selector Popup */}
          {showProjectSelector && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowProjectSelector(false)}
              />

              {/* Popup Menu */}
              <div className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-96 flex flex-col">
                {/* Create New Project Button */}
                <button
                  onClick={() => {
                    setShowProjectSelector(false);
                    onCreateProject();
                  }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition border-b border-gray-200"
                >
                  <div className="w-8 h-8 bg-black rounded flex items-center justify-center flex-shrink-0">
                    <svg width="16" height="16" fill="none" stroke="white" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span className="font-medium text-gray-900">Create New Project</span>
                </button>

                {/* Projects List */}
                <div className="overflow-y-auto flex-1">
                  {allProjects.map(proj => (
                    <button
                      key={proj.id}
                      onClick={() => {
                        setShowProjectSelector(false);
                        onProjectSwitch(proj.id);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition ${
                        proj.id === projectId ? 'bg-gray-100' : ''
                      }`}
                    >
                      <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                        proj.id === projectId
                          ? 'bg-black text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {proj.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="font-medium text-gray-900 truncate">{proj.name}</div>
                        {proj.lastUpdated && (
                          <div className="text-xs text-gray-500">
                            {proj.lastUpdated.toDate().toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      {proj.id === projectId && (
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-black flex-shrink-0">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <button
            onClick={() => {
              // TODO: Add upgrade functionality
              console.log('Upgrade clicked');
            }}
            className="w-full bg-black text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-gray-800 transition flex items-center justify-start gap-2 mb-2"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Upgrade
          </button>

          <button
            onClick={() => setShowProjectSelector(!showProjectSelector)}
            className="w-full text-gray-700 px-4 py-1.5 rounded text-sm font-medium hover:bg-gray-200 transition flex items-center justify-start gap-2 mb-2"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Switch Project
          </button>

          <button
            onClick={async () => {
              if (window.confirm('Are you sure you want to log out?')) {
                await signOut(auth);
              }
            }}
            className="w-full text-gray-700 px-4 py-1.5 rounded text-sm font-medium hover:bg-gray-200 transition flex items-center justify-start gap-2"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Log Out
          </button>
        </div>

      </div>

      {/* Collaborators Modal */}
      {showCollaborators && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
            style={{ zIndex: 10000 }}
            onClick={() => setShowCollaborators(false)}
          />

          {/* Modal */}
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-xl rounded-lg shadow-2xl border border-gray-200/50 w-full max-w-lg" style={{ zIndex: 10001 }}>
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-semibold text-gray-900">Collaborators</h3>
                <button
                  onClick={() => setShowCollaborators(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <CollaboratorManager project={{ ...project, id: projectId }} />
            </div>
          </div>
        </>
      )}

      {/* Help Icon - Fixed bottom right */}
      <button
        className="fixed bottom-6 right-6 w-9 h-9 bg-white text-gray-600 rounded-full shadow-md hover:shadow-lg transition-all hover:scale-105 flex items-center justify-center"
        style={{ zIndex: 1000 }}
        onClick={() => {
          // TODO: Add help functionality
          console.log('Help clicked');
        }}
      >
        <div className="relative flex items-center justify-center w-full h-full">
          <svg width="36" height="36" fill="none" stroke="currentColor" viewBox="0 0 36 36" className="absolute">
            <circle cx="18" cy="18" r="17" strokeWidth="1.5" />
          </svg>
          <span style={{ fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: '14px', fontWeight: '500' }}>?</span>
        </div>
      </button>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto" style={{ marginLeft: '270px', backgroundColor: '#ffffff' }}>
        <div className="max-w-5xl mx-auto pt-16 px-6 pr-12 pb-20" key={currentSection}>
          {/* Content Container */}
          <div className="px-20 pt-20 pb-8">
          {/* Section Content */}
          {currentSection === 1 && (
            isLoaded ? (
              <Section1Formation
                formData={formData}
                handleChange={handleChange}
                isReadOnly={isReadOnly}
                showValidation={showValidation}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading...</p>
              </div>
            )
          )}
          {currentSection === 2 && (
            <Section2Cofounders
              formData={formData}
              handleChange={handleChange}
              isReadOnly={isReadOnly}
              showValidation={showValidation}
              project={project}
            />
          )}
          {currentSection === 3 && (
            <Section3EquityAllocation
              formData={formData}
              handleChange={handleChange}
              isReadOnly={isReadOnly}
              project={project}
              showValidation={showValidation}
            />
          )}
          {currentSection === 4 && (
            <Section5EquityVesting
              formData={formData}
              handleChange={handleChange}
              isReadOnly={isReadOnly}
              project={project}
              showValidation={showValidation}
            />
          )}
          {currentSection === 5 && (
            <Section4DecisionMaking
              formData={formData}
              handleChange={handleChange}
              isReadOnly={isReadOnly}
              project={project}
              showValidation={showValidation}
            />
          )}
          {currentSection === 6 && (
            <Section6IP
              formData={formData}
              handleChange={handleChange}
              isReadOnly={isReadOnly}
              project={project}
              showValidation={showValidation}
            />
          )}
          {currentSection === 7 && (
            <Section7Compensation
              formData={formData}
              handleChange={handleChange}
              isReadOnly={isReadOnly}
              showValidation={showValidation}
            />
          )}
          {currentSection === 8 && (
            <Section8Performance
              formData={formData}
              handleChange={handleChange}
              isReadOnly={isReadOnly}
              showValidation={showValidation}
            />
          )}
          {currentSection === 9 && (
            <Section9NonCompete
              formData={formData}
              handleChange={handleChange}
              isReadOnly={isReadOnly}
              project={project}
              showValidation={showValidation}
            />
          )}
          {currentSection === 10 && (
            <Section10Final
              formData={formData}
              handleChange={handleChange}
              isReadOnly={isReadOnly}
              project={project}
              showValidation={showValidation}
            />
          )}

          {/* Next Button */}
          {!isReadOnly && (
            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setCurrentSection(Math.max(1, currentSection - 1))}
                disabled={currentSection === 1}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>

              {currentSection < 10 ? (
                <button
                  onClick={() => setCurrentSection(currentSection + 1)}
                  className="next-button bg-black text-white px-9 py-3 rounded font-normal hover:bg-gray-800 transition"
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={handlePreviewClick}
                  disabled={saveStatus === 'saving'}
                  className="next-button bg-black text-white px-12 py-3 rounded font-normal hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next: Preview & Approve →
                </button>
              )}
            </div>
          )}
          </div>
          {/* End White Card Container */}
        </div>
      </div>
    </div>
  );
}

export default Survey;
