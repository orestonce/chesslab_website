<?php

namespace App\Controller\Pages\SignIn;

use OTPHP\InternalClock;
use OTPHP\TOTP;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;

class SignInController extends AbstractController
{
    public function index(): Response
    {
        return $this->render('pages/sign_in/index.html.twig');
    }
}
